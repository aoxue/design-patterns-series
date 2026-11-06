"""跨平台 TTS 样片配音生成器 + 逐句时间戳采集（edge-tts）。

产出两样（都在 public/audio/<EPxx>/）：
  1. *.mp3        样片配音
  2. align.json   逐句时间戳 sidecar（words 词级 + chunks 句级）——
                  字幕与动画锚点据此与语音逐句锁死（音频是唯一时钟）。

真声替换：录同名 mp3 覆盖后，用 whisper 对齐工具重算 align.json（见 video/README 待办）。

用法：
    pip install edge-tts
    python tools/tts.py                        # 默认音色 zh-CN-XiaoxiaoNeural
    python tools/tts.py --voice zh-CN-YunxiNeural
"""
import asyncio
import json
import re
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural"
# 知识区节奏稍快；如需更慢改 "+0%"
RATE = "+8%"

SENT_SPLIT = re.compile(r"(?<=[。！？；])")
STRIP = re.compile(r"[^0-9A-Za-z\u4e00-\u9fff]")
# 字幕原子块：连续英文/代码记号（字母数字 _ . ( ) 空格 = < > ! + - 连成的表达式，
# 如 ghost == getInstance()、private static final …），内部永不断行
TOKEN = re.compile(r" ?([0-9A-Za-z_][0-9A-Za-z_().=/<>!+-]*(?: [0-9A-Za-z_().=/<>!+-]+)*)| ?.")
CLOSERS = set("）)；，。！？：、》」")
OPENERS = set("（(《「")


def split_subtitles(text: str) -> list[str]:
    """与 src/data.ts 的 splitSubtitles 保持同一套断句（改那里须同步这里与 sync-check.mjs）。
    三级：句末标点 → 逗号/冒号 → 原子块贪心。英文/代码原子块内部不断行：
    装不下时整块断到下一行；行首大原子（≥12 字符）后跟短中文尾（≤8 字）时原子独立成条；
    断行处保底剩余至少 2 个汉字，避免「了；」类孤行。"""
    sentences = [s.strip() for s in SENT_SPLIT.split(text) if s.strip()]
    chunks: list[str] = []
    for s in sentences:
        if len(s) <= 26:
            chunks.append(s)
            continue
        buf, lead_atom_end = "", 0
        for part in re.split(r"(?<=[，——：])", s):
            toks = list(TOKEN.finditer(part))
            for idx, m in enumerate(toks):
                tok, core = m.group(0), m.group(0).strip()
                if not core:
                    continue
                if core in CLOSERS:
                    if buf.strip():
                        buf += core
                    elif chunks and len(chunks[-1]) < 28:
                        chunks[-1] += core
                    continue
                if len(buf) + len(tok) > 26 and buf.strip():
                    if lead_atom_end and len(buf) - lead_atom_end <= 8:
                        # 行首大原子 + 短中文尾：原子独立成条，尾巴顺延到下一行
                        chunks.append(buf[:lead_atom_end].strip())
                        buf = buf[lead_atom_end:]
                    elif buf.rstrip() and buf.rstrip()[-1] in OPENERS:
                        # 开括号悬尾：随下一行走，避免「（」独行
                        b = buf.rstrip()
                        chunks.append(b[:-1].strip())
                        buf = b[-1]
                    elif (toks[idx].group(1) is not None
                          and len(toks[idx].group(1)) >= 8):
                        # 下一 token 是自给自足的大原子块（独立成行不会孤行），直接断行不匀字
                        chunks.append(buf.strip())
                        buf = ""
                    else:
                        moved = ""
                        tail_cjk = len(re.findall(r"[一-鿿]",
                                                   "".join(t.group(0) for t in toks[idx:])))
                        while (tail_cjk < 2 and len(buf) > 9
                               and buf[-1] not in OPENERS and buf[-1] != " "):
                            moved = buf[-1] + moved
                            buf = buf[:-1]
                            tail_cjk += 1
                        chunks.append(buf.strip())
                        buf = moved
                prev_len = len(buf)
                buf += tok
                if m.group(1) is not None and len(core) >= 12:
                    lead_atom_end = len(buf) if prev_len == 0 else 0
                elif prev_len == 0:
                    lead_atom_end = 0
        if buf.strip():
            chunks.append(buf.strip())
    return chunks


def chunks_from_chartimes(shot: dict, char_at: list[tuple[float, float]]) -> list[dict]:
    """由「字符级时间轴」产出字幕 chunk 序列（whisper_align.py 复用，断句单一副本）。

    char_at：与 shot["tts"] 剥离标点后逐字符对应的 (起秒, 止秒) 列表。
    逻辑：tts 各句按剥离字数在 char_at 上切句边界；subtitle 同款断句后，
    句内 chunk 按字符占比线性内插。
    """
    tts_sents = [s for s in SENT_SPLIT.split(shot["tts"]) if s.strip()]
    sub_sents = [s for s in SENT_SPLIT.split(shot["subtitle"]) if s.strip()]
    # 句界奇偶校验：subtitle 句按下标配 tts 句时间，两稿句末标点（。！？；）
    # 必须同构。EP01 4.2 曾因口播稿把句号改逗号少了一句，全部字幕句错配到
    # 下一句时间且无任何报错（2026-11-05 排查两小时方定位）。
    if len(sub_sents) != len(tts_sents):
        raise ValueError(f"{shot.get('id', shot.get('file', '?'))} 句界不同构："
                         f"tts {len(tts_sents)} 句 / subtitle {len(sub_sents)} 句，"
                         f"两稿句末标点（。！？；）须一一对应")
    tts_lens = [len(STRIP.sub("", s)) for s in tts_sents]

    sent_bounds: list[tuple[float, float]] = []
    pos = 0
    for L in tts_lens:
        start_i = pos
        end_i = min(pos + L, len(char_at))
        s_t = char_at[start_i][0] if start_i < len(char_at) else char_at[-1][1]
        e_t = char_at[end_i - 1][1] if end_i > start_i else s_t
        sent_bounds.append((s_t, e_t))
        pos = end_i

    chunks_out = []
    for si, s_text in enumerate(sub_sents):
        s_t, e_t = sent_bounds[si] if si < len(sent_bounds) else sent_bounds[-1]
        sent_chunks = split_subtitles(s_text)
        sent_len = len(STRIP.sub("", s_text)) or 1
        t0 = s_t
        for c in sent_chunks:
            frac = (len(STRIP.sub("", c)) or 1) / sent_len
            chunks_out.append({"text": c, "s": round(t0, 3), "e": round(t0 + (e_t - s_t) * frac, 3)})
            t0 += (e_t - s_t) * frac
    return chunks_out


def pick_voice() -> str:
    if "--voice" in sys.argv:
        return sys.argv[sys.argv.index("--voice") + 1]
    return DEFAULT_VOICE


async def synth(shot: dict, voice: str, out_dir: Path) -> dict:
    """合成一镜音频并采集词级边界 → {words, chunks}（时间均为音频内相对秒）"""
    words: list[list] = []
    buf = bytearray()
    comm = edge_tts.Communicate(shot["tts"], voice, rate=RATE, boundary="WordBoundary")
    async for chunk in comm.stream():
        if chunk["type"] == "audio":
            buf.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            s = chunk["offset"] / 1e7  # 100ns → 秒
            e = s + chunk["duration"] / 1e7
            words.append([round(s, 3), round(e, 3), chunk["text"]])
    (out_dir / shot["file"]).write_bytes(bytes(buf))
    if not words:
        print(f"⚠ {shot['id']} 未采集到词边界")
        return {"words": [], "chunks": []}

    # 词时间轴 → 每个词字符的 (s,e)，供句边界取时间
    char_at: list[tuple[float, float]] = []
    for w in words:
        n = len(STRIP.sub("", w[2])) or 1
        for _ in range(n):
            char_at.append((w[0], w[1]))

    # tts 文本与字幕文本同句数（仅数字等局部写法不同）；
    # 句边界与 chunk 内插见 chunks_from_chartimes（whisper_align.py 复用同一段逻辑）
    chunks_out = chunks_from_chartimes(shot, char_at)
    return {"words": words, "chunks": chunks_out}


async def main() -> None:
    ep_dir = ROOT / "public" / "episodes"
    audio_dir = ROOT / "public" / "audio"
    voice = pick_voice()
    for ep_file in sorted(ep_dir.glob("*.json")):
        ep = ep_file.stem  # 如 EP01；音频与台词同名子目录一一对应
        shots = json.loads(ep_file.read_text(encoding="utf-8"))
        out_dir = audio_dir / ep
        out_dir.mkdir(parents=True, exist_ok=True)
        align = {"voice": voice, "shots": {}}
        for shot in shots:
            align["shots"][shot["id"]] = await synth(shot, voice, out_dir)
            n = len(align["shots"][shot["id"]]["chunks"])
            print(f"OK  {ep}/{shot['file']}  chunks={n}")
        (out_dir / "align.json").write_text(
            json.dumps(align, ensure_ascii=False, indent=1), encoding="utf-8"
        )
        print(f"align → public/audio/{ep}/align.json")
    print(f"done ({voice}) -> public/audio/<EPxx>/")


if __name__ == "__main__":
    asyncio.run(main())
