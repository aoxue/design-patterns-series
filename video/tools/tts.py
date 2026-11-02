"""跨平台占位配音生成器（edge-tts · 微软神经语音，Windows/macOS/Linux 通用）。

用法：
    pip install edge-tts
    python tools/tts.py                        # 默认音色 zh-CN-XiaoxiaoNeural
    python tools/tts.py --voice zh-CN-YunxiNeural   # 换男声

真声替换：录同名 mp3 覆盖 public/audio/ 即可，场景时长自动重算（音频槽位架构）。
"""
import asyncio
import json
import sys
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_VOICE = "zh-CN-XiaoxiaoNeural"
# 知识区节奏稍快；如需更慢改 "+0%"
RATE = "+8%"


def pick_voice() -> str:
    if "--voice" in sys.argv:
        return sys.argv[sys.argv.index("--voice") + 1]
    return DEFAULT_VOICE


async def main() -> None:
    lines = json.loads((ROOT / "public" / "lines.json").read_text(encoding="utf-8"))
    out_dir = ROOT / "public" / "audio"
    out_dir.mkdir(parents=True, exist_ok=True)
    voice = pick_voice()
    for line in lines:
        out = out_dir / line["file"]
        await edge_tts.Communicate(line["tts"], voice, rate=RATE).save(str(out))
        print(f"OK  {line['file']}")
    print(f"done ({voice}) -> public/audio/")


asyncio.run(main())
