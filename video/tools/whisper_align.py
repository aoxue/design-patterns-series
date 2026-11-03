"""真声对齐器：faster-whisper 词级时间戳 → 重算 align.json（与 tts.py 同构）。

换声流程（video/README）：真声 mp3 同名覆盖 public/audio/EPxx/ 后跑本脚本，
字幕与动画锚点随新 align.json 全自动重排，无需改任何场景代码。

对齐策略：whisper 转写与预期 tts 文本存在识别误差（错字/漏字/数字格式差异），
先剥离标点做 difflib 字符级对齐，为预期文本每个字符定位时间，
再复用 tts.py 的句边界与 chunk 内插（chunks_from_chartimes，断句单一副本）。

用法：
    pip install faster-whisper
    python tools/whisper_align.py EP01                 # small 模型，CPU int8，写入 align.json
    python tools/whisper_align.py EP01 --model medium  # 更高精度（更慢）
    python tools/whisper_align.py EP01 --check         # 只读不写：与现有 align.json 对比偏差（验收用）
"""
import difflib
import json
import sys
from pathlib import Path

from tts import STRIP, chunks_from_chartimes

ROOT = Path(__file__).resolve().parent.parent
# 对齐覆盖率（预期字符被 whisper 匹配到的比例）低于此值警告人工复核
COVERAGE_WARN = 0.6


def transcribe(mp3: Path, model) -> list[dict]:
    """单条音频 → whisper 词序列 [{word, start, end}]（中文、VAD 过滤首尾静音）。"""
    segments, _ = model.transcribe(str(mp3), language="zh", word_timestamps=True, vad_filter=True)
    return [w for seg in segments for w in seg.words]


def char_times(words: list[dict]) -> tuple[str, list[tuple[float, float]]]:
    """whisper 词序列 → (剥离标点后的字符序列, 每字符 (起, 止))。"""
    chars, times = "", []
    for w in words:
        t = STRIP.sub("", w.word)
        if not t:
            continue  # 纯标点词无时间贡献
        chars += t
        for _ in t:
            times.append((round(w.start, 3), round(w.end, 3)))
    return chars, times


def align_chars(wchars: str, wtimes, tchars: str) -> tuple[list, float]:
    """预期字符序列逐位取时间：difflib 匹配块直取，未匹配段线性插值。

    返回 (长度 = len(tchars) 的时间列表, 覆盖率)。
    """
    sm = difflib.SequenceMatcher(None, wchars, tchars, autojunk=False)
    times: list = [None] * len(tchars)
    matched = 0
    for i, j, n in sm.get_matching_blocks():
        matched += n
        for k in range(n):
            times[j + k] = wtimes[i + k]

    # 未匹配段：取前后最近已定位位置线性插值；首尾越界段取边界值
    known = [(i, t) for i, t in enumerate(times) if t]
    if not known:  # 全未匹配：整镜按音频全长兜底
        total = wtimes[-1][1] if wtimes else 1.0
        return [(0.0, total)] * len(tchars), 0.0
    first_i, first_t = known[0]
    for i in range(first_i):
        times[i] = first_t
    last_i, last_t = known[-1]
    for i in range(last_i + 1, len(times)):
        times[i] = last_t
    for (i0, t0), (i1, t1) in zip(known, known[1:]):
        if i1 - i0 > 1:
            for i in range(i0 + 1, i1):
                f = (i - i0) / (i1 - i0)
                times[i] = (t0[0] + (t1[0] - t0[0]) * f, t0[1] + (t1[1] - t0[1]) * f)
    return times, matched / len(tchars)


def main() -> None:
    ep = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else "EP01"
    model_name = sys.argv[sys.argv.index("--model") + 1] if "--model" in sys.argv else "small"
    check_only = "--check" in sys.argv

    audio_dir = ROOT / "public" / "audio" / ep
    shots = json.loads((ROOT / "public" / "episodes" / f"{ep}.json").read_text(encoding="utf-8"))
    existing = json.loads((audio_dir / "align.json").read_text(encoding="utf-8")) if check_only else None

    from faster_whisper import WhisperModel

    print(f"加载模型 {model_name}（首次运行会下载）…")
    model = WhisperModel(model_name, device="cpu", compute_type="int8")

    align = {"voice": "human", "shots": {}}
    warn = []
    diffs = []
    for shot in shots:
        mp3 = audio_dir / shot["file"]
        if not mp3.exists():
            print(f"⚠ {shot['id']} 缺音频 {mp3.name}，跳过")
            continue
        words = transcribe(mp3, model)
        wchars, wtimes = char_times(words)
        tchars = STRIP.sub("", shot["tts"])
        times, cov = align_chars(wchars, wtimes, tchars)
        if cov < COVERAGE_WARN:
            warn.append(f"{shot['id']}（覆盖 {cov:.0%}，疑似念错/漏句/噪声，建议复听）")
        chunks = chunks_from_chartimes(shot, times)
        align["shots"][shot["id"]] = {
            "words": [[w.start, w.end, w.word.strip()] for w in words],
            "chunks": chunks,
        }
        msg = f"OK  {shot['file']}  chunks={len(chunks)}  覆盖 {cov:.0%}"
        if check_only:
            old = existing["shots"].get(shot["id"], {}).get("chunks", [])
            ds = [abs(c["s"] - o["s"]) for c, o in zip(chunks, old) if c["text"] == o["text"]]
            if ds:
                diffs += ds
                msg += f"  vs 现有 align 偏差 avg {sum(ds)/len(ds):.2f}s max {max(ds):.2f}s"
        print(msg)

    print(f"\n覆盖率警告 {len(warn)} 条：" if warn else "\n覆盖率全部达标。")
    for w in warn:
        print("  ⚠", w)
    if check_only:
        if diffs:
            print(f"全片偏差统计：avg {sum(diffs)/len(diffs):.2f}s  max {max(diffs):.2f}s（共 {len(diffs)} chunk）")
        print("--check 只读模式，未写入任何文件")
        return
    (audio_dir / "align.json").write_text(json.dumps(align, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"align → public/audio/{ep}/align.json（voice=human）")


if __name__ == "__main__":
    main()
