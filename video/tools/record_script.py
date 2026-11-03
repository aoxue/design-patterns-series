"""导演录音稿导出器：把 EPxx.json 的 tts 口播读音稿按镜导出成可照念的文本。

一镜一条录音工作法的配套物（SOP §4.1：tts = 口播读音稿，真人录音以它为准）。

用法：
    python tools/record_script.py EP01                  # 输出 out/record-script-EP01.txt
    python tools/record_script.py EP01 --out 某路径.txt  # 指定输出位置（如桌面）
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

HEADER = """{ep} 录音稿（口播读音稿，直接照念）
========================================

用法：
1. 一镜一条，按【镜号】分段，每段录一个文件，文件名用括号里的名字（如 1-1）
2. 念错、口吃、喷麦：整条重录，不要在一条里停顿补救
3. 语速比平时说话稍慢；开场钩子段要有劲，金句段放慢念
4. 全部录完放到一个文件夹后告诉 AI，由配音师入库换轨
"""


def export(ep, out=None):
    """读 public/episodes/{ep}.json，按镜输出录音稿；返回 (输出路径, 镜数)。"""
    src = ROOT / "public" / "episodes" / f"{ep}.json"
    shots = json.loads(src.read_text(encoding="utf-8"))
    lines = [HEADER.format(ep=ep)]
    for s in shots:
        stem = Path(s["file"]).stem
        lines.append(f"【{s['id']}】（文件名 {stem}）")
        lines.append(s["tts"])
        lines.append("")
    out = out or (ROOT / "out" / f"record-script-{ep}.txt")
    out.parent.mkdir(parents=True, exist_ok=True)
    # utf-8-sig：Windows 记事本直接打开不乱码；BOM 对 macOS 编辑器无碍（跨机中立）
    out.write_text("\n".join(lines), encoding="utf-8-sig")
    return out, len(shots)


if __name__ == "__main__":
    ep = sys.argv[1] if len(sys.argv) > 1 else "EP01"
    out_arg = None
    if "--out" in sys.argv:
        out_arg = Path(sys.argv[sys.argv.index("--out") + 1])
    path, n = export(ep, out_arg)
    print(f"OK：{n} 段已写入 {path}")
