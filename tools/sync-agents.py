"""虚拟团队定义跨工具同步器：.zcode/agents/*.md（正典）→ Claude / Codex 副本。

三个工具的项目级 subagent 目录：
  ZCode        .zcode/agents/*.md    md + frontmatter（正典，直接加载）
  Claude Code  .claude/agents/*.md   md + frontmatter（同源格式，原样复制）
  Codex        .codex/agents/*.toml  TOML（developer_instructions 内联，由 md 正文转译）

纪律：改 .zcode/agents/ 下任何定义后必跑本脚本（地位等同 video 的 lint:colors），
副本进 git 随仓库分发，跨机 clone 即用。

用法：
    python tools/sync-agents.py           # 同步（有差异才写）
    python tools/sync-agents.py --check   # 只检查副本是否过期，不写（退出码非 0 = 过期）
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / ".zcode" / "agents"

FM = re.compile(r"\A---\n(.*?)\n---\n(.*)\Z", re.S)


def parse(md: str):
    """md → (frontmatter dict, 正文)。仅识别 name / description / tools 三个字段。"""
    m = FM.match(md)
    if not m:
        raise SystemExit(f"frontmatter 解析失败：{md[:60]}…")
    meta = {}
    for line in m.group(1).splitlines():
        k, _, v = line.partition(":")
        meta[k.strip()] = v.strip()
    return meta, m.group(2)


def to_toml(meta: dict, body: str) -> str:
    """md 定义 → Codex TOML。正文用 TOML literal 多行字符串（'''），不转义。

    正文若含 ''' 序列会破坏 TOML（中文文档几乎不可能），显式报错人工处理。
    tools 字段 Codex 不使用（能力由 features 开关控制，默认继承父会话）。
    """
    if "'''" in body:
        raise SystemExit("正文含 ''' 无法安全转 TOML，请人工处理")
    desc = meta["description"].strip('"').replace('"', '\\"')
    return (
        f'name = "{meta["name"]}"\n'
        f'description = "{desc}"\n'
        f"developer_instructions = '''{body.rstrip()}'''\n"
    )


def main() -> None:
    check_only = "--check" in sys.argv
    stale = 0
    for src in sorted(SRC.glob("*.md")):
        meta, body = parse(src.read_text(encoding="utf-8"))

        claude = ROOT / ".claude" / "agents" / src.name
        claude.parent.mkdir(parents=True, exist_ok=True)
        src_text = src.read_text(encoding="utf-8")
        if not claude.exists() or claude.read_text(encoding="utf-8") != src_text:
            stale += 1
            print(f"过期: {claude.relative_to(ROOT)}")
            if not check_only:
                claude.write_text(src_text, encoding="utf-8")
                print(f"  已同步（原样复制）")

        codex = ROOT / ".codex" / "agents" / (src.stem + ".toml")
        codex.parent.mkdir(parents=True, exist_ok=True)
        toml = to_toml(meta, body)
        if not codex.exists() or codex.read_text(encoding="utf-8") != toml:
            stale += 1
            print(f"过期: {codex.relative_to(ROOT)}")
            if not check_only:
                codex.write_text(toml, encoding="utf-8")
                print(f"  已同步（md → TOML 转译）")

    if stale == 0:
        print("全部同步。")
    elif check_only:
        print(f"{stale} 个副本过期，先跑 python tools/sync-agents.py")
        sys.exit(1)


if __name__ == "__main__":
    main()
