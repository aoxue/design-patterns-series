# coding=utf-8
"""qwen-audio-3.1-tts-next 配音生成器（主力 TTS，2026-11 EP01 全片实战定稿）。

一段一条工作法：段 = 若干镜台词连念 + 逐句表演指令（自然度远优于逐镜生成）。
流程：逐段生成（声纹参考 + 表演指令 + 固定 seed + rate）→ mp3 归一化
→ 段级质检（复读比 + 时长带，不过自动重掷）→ whisper 定镜边界切回每镜槽位。

配置三处：
  public/episodes/EPxx.json       台词（唯一台词源，占位符从这里注入）
  public/episodes/EPxx.segs.json  段划分 + 表演指令壳（编导交付物，写法见 SOP §4.1）
  video/.env                      DASHSCOPE_API_KEY（cp .env.example 填写）

用法：
  python3 tools/tts_qwen.py EP01              # 全流程；已有段音频跳过生成（断点续跑）
  python3 tools/tts_qwen.py EP01 --force      # 全部段重新生成
  python3 tools/tts_qwen.py EP01 --split-only # 只切镜（段音频已备齐）
产物：public/audio/EPxx/<镜>.mp3（槽位）+ out/segs/Sx.mp3/.prompt.txt（段留档）

qwen 模型硬特性（踩坑实录，详见 video/README「qwen TTS 坑清单」）：
  无 voice/emotion 参数（语气全靠指令描述）；同参数多次生成结果不同（seed 不保复现，
  质检+重掷是标配）；带参考音频时 mp3 时长头谎报（必须 ffmpeg 归一化）；偶发整镜漏念
  或纯非语音输出（复读比拦截）；输出上限 120s（段预算 ≤470 字）；会自配背景音
  （指令壳尾保留「只有干净人声」约束句）。
"""
import base64
import json
import mimetypes
import os
import subprocess
import sys

import requests

from tts import STRIP                                        # 断句单一副本
from whisper_align import align_chars, char_times, transcribe  # 对齐单一副本

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
API = "https://cn-beijing.maas.qianwenaiapi.com/api/v1/services/audio/tts/SpeechSynthesizer"
MODEL = "qwen-audio-3.1-tts-next"
RETRIES = 3
# 质检带宽：复读比（whisper 转写字数/预期字数）与时长带（5.1 字/秒为知识区口播基准）
RATIO_LO, RATIO_HI = 0.80, 1.15
DUR_LO_K, DUR_HI_K = 0.70, 1.40
COVERAGE_MIN = 0.6


def load_key():
    """优先读 video/.env（协作者各自持有、不入库），否则退回环境变量"""
    env_file = os.path.join(ROOT, ".env")
    if os.path.exists(env_file):
        for line in open(env_file, encoding="utf-8"):
            if line.startswith("DASHSCOPE_API_KEY="):
                return line.split("=", 1)[1].strip()
    return os.environ.get("DASHSCOPE_API_KEY")


def synth(text_prompt, out_file, api_key, ref_path, rate, seed):
    """调一次合成接口并下载；4xx 抛响应体（参数/鉴权），5xx/网络错误重试"""
    audio_input = {
        "text_prompt": text_prompt,
        "format": "mp3",        # 槽位契约（EPxx.json 的 file 字段均为 mp3）
        "sample_rate": 48000,
        "seed": seed,           # 固定 seed：复现辅助（不保证，见模块 docstring）
        "rate": rate,           # 语速硬参数：prompt 写「从容」实测无效，节奏只能靠它
    }
    if ref_path:
        mime = mimetypes.guess_type(ref_path)[0] or "audio/mpeg"
        b64 = base64.b64encode(open(ref_path, "rb").read()).decode()
        audio_input["references"] = [{"audio_data": f"data:{mime};base64,{b64}"}]
    for attempt in range(1, RETRIES + 1):
        try:
            r = requests.post(API, headers={"Authorization": f"Bearer {api_key}",
                                            "Content-Type": "application/json"},
                              json={"model": MODEL, "input": audio_input}, timeout=300)
            if r.status_code != 200:
                raise RuntimeError(f"HTTP {r.status_code}：{r.text[:300]}")
            audio_url = r.json()["output"]["audio"]["url"]
            a = requests.get(audio_url, timeout=60)
            a.raise_for_status()
            with open(out_file, "wb") as f:
                f.write(a.content)
            return
        except (requests.RequestException, RuntimeError) as e:
            if attempt == RETRIES:
                raise
            print(f"    请求重试 {attempt}/{RETRIES - 1}：{e}")


def normalize(path):
    """带参考音频时 qwen 输出的 mp3 时长头会谎报（实测 36s 头/14s 数据），重编码归一化"""
    fixed = path + ".fixed.mp3"
    subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-b:a", "128k", fixed, "-y"], check=True)
    os.replace(fixed, path)


def seg_check(mp3, expect_chars, model):
    """段级质检：复读比拦复读/漏念/非语音，时长带拦语速暴走（±30% 表演弹性）"""
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                "-of", "csv=p=0", mp3], capture_output=True, text=True).stdout)
    segs = list(model.transcribe(mp3, language="zh", vad_filter=True)[0])
    got = len(STRIP.sub("", "".join(s.text for s in segs)))
    ratio = got / expect_chars
    lo, hi = expect_chars / 5.1 * DUR_LO_K, expect_chars / 5.1 * DUR_HI_K
    ok = RATIO_LO <= ratio <= RATIO_HI and lo <= dur <= hi
    print(f"    质检：复读比 {ratio:.2f}，时长 {dur:.0f}s（带 {lo:.0f}–{hi:.0f}）"
          f"  {'✓' if ok else '✗ 重试'}")
    return ok


def split_segment(seg_mp3, seg_shots, model, audio_dir):
    """段音频 → 槽位镜 mp3：整段台词拼接一次 difflib 对齐（长文本锚定稳，
    逐镜独立对齐会让短镜匹配飞位），再按各镜累计字数切窗、相邻镜中点切分。
    返回失败镜 id 列表（空 = 成功）。"""
    words = transcribe(seg_mp3, model)
    wchars, wtimes = char_times(words)
    full = "".join(STRIP.sub("", s["tts"]) for s in seg_shots)
    times, cov = align_chars(wchars, wtimes, full)
    print(f"    整段覆盖 {cov:.0%}")
    if cov < COVERAGE_MIN:
        return [s["id"] for s in seg_shots]  # 念漏/非语音内容，整段重生成

    bounds, pos = [], 0
    for shot in seg_shots:
        L = len(STRIP.sub("", shot["tts"]))
        bounds.append((times[pos][0], times[min(pos + L - 1, len(times) - 1)][1]))
        pos += L
    cuts = [0.0] + [(bounds[i][1] + bounds[i + 1][0]) / 2
                    for i in range(len(bounds) - 1)] + [None]
    for shot, (t0, t1) in zip(seg_shots, zip(cuts, cuts[1:])):
        out = os.path.join(audio_dir, shot["file"])
        cmd = ["ffmpeg", "-v", "error", "-i", seg_mp3]
        if t0 > 0.05:
            cmd += ["-ss", f"{t0:.2f}"]
        if t1 is not None:
            cmd += ["-to", f"{t1:.2f}"]
        subprocess.run(cmd + ["-b:a", "128k", out, "-y"], check=True)
    return []


def main():
    args = [a for a in sys.argv[1:]]
    ep = args[0] if args and not args[0].startswith("-") else "EP01"
    force, split_only = "--force" in args, "--split-only" in args

    shots = json.loads(open(os.path.join(ROOT, "public/episodes", f"{ep}.json"),
                            encoding="utf-8").read())
    by_id = {s["id"]: s for s in shots}
    cfg = json.loads(open(os.path.join(ROOT, "public/episodes", f"{ep}.segs.json"),
                          encoding="utf-8").read())
    ref = os.path.join(ROOT, cfg["voice"])
    rate, seed = cfg.get("rate", 0.85), cfg.get("seed", 42)
    audio_dir = os.path.join(ROOT, "public/audio", ep)
    seg_dir = os.path.join(ROOT, "out", "segs")
    os.makedirs(audio_dir, exist_ok=True)
    os.makedirs(seg_dir, exist_ok=True)

    from faster_whisper import WhisperModel
    print("加载 whisper base（质检 + 切镜）…")
    model = WhisperModel("base", device="cpu", compute_type="int8")

    api_key = load_key()
    for seg in cfg["segments"]:
        name, ids, shell = seg["id"], seg["shots"], seg["prompt"]
        # 占位防呆：段内每镜必须有 {镜id} 占位，缺了台词就进不了 prompt
        # （EP01 S1 曾因引导句无占位险些生成缺台词废品，靠旧音频续用蒙混过关）
        missing = [i for i in ids if "{" + i + "}" not in shell]
        if missing:
            sys.exit(f"[{name}] 指令壳缺占位符：{missing}（segs.json 的 prompt 必须含段内每镜占位）")
        seg_shots = [by_id[i] for i in ids]
        expect = sum(len(STRIP.sub("", s["tts"])) for s in seg_shots)
        seg_mp3 = os.path.join(seg_dir, f"{name}.mp3")

        # 生成 → 段级质检 → 切镜 → 覆盖判定，任一失败重试整段（失败必须删段，
        # 否则断点续跑逻辑下一轮又跳过生成）
        for attempt in range(1, RETRIES + 1):
            if os.path.exists(seg_mp3) and not force:
                print(f"[{name}] 已有段音频，直接切镜（--force 可重生成）")
            else:
                if split_only:
                    sys.exit(f"[{name}] 段音频不存在，--split-only 无法进行：{seg_mp3}")
                print(f"[{name}] 生成（第 {attempt} 次，{expect} 字）…")
                prompt = shell
                for s in seg_shots:
                    prompt = prompt.replace("{" + s["id"] + "}", s["tts"])
                # 实际下发 prompt 留档：质量复盘对照「好段/坏段的指令差异」
                with open(os.path.join(seg_dir, f"{name}.prompt.txt"), "w",
                          encoding="utf-8") as f:
                    f.write(prompt)
                synth(prompt, seg_mp3, api_key, ref, rate, seed)
                normalize(seg_mp3)
                if not seg_check(seg_mp3, expect, model):
                    continue
            print(f"[{name}] 切镜 → {ids}")
            bad = split_segment(seg_mp3, seg_shots, model, audio_dir)
            if not bad:
                break
            os.remove(seg_mp3)
            print(f"[{name}] 失败镜 {bad}，删段重生成")

    print(f"\n全部段完成 → public/audio/{ep}/")
    print(f"下一步：python3 tools/whisper_align.py {ep}")


if __name__ == "__main__":
    main()
