"""虚拟团队定义同步器：.agents/*.md（正典）→ 本机各工具的 subagent 目录。

架构（见 AGENTS.md「虚拟团队接入」）：
  .agents/*.md            正典，唯一事实源，只在这里改（随仓库分发）
  .zcode/agents/*.md      ZCode 本机副本（原样复制）
  .claude/agents/*.md     Claude Code 本机副本（原样复制，格式同源）
  .codex/agents/*.toml    Codex 本机副本（转译 TOML：developer_instructions 内联）

副本是**本机运行时产物，不进 git**（已 ignore）：每台机器首次使用前跑一次本脚本
（或由会话 AI 按 AGENTS.md 接入协议自动做），新副本需重开会话才被工具加载。
本脚本是**已知工具的便利层**，不是接入的唯一通路：新工具按接入协议由该工具的
会话 AI 自行处理，脚本无需为每个新工具扩展。

用法：
    python tools/sync-agents.py           # 同步（有差异才写）
    python tools/sync-agents.py --check   # 只检查副本是否过期，不写（退出码非 0 = 过期）
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / ".agents"

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


def sync_one(target: Path, content: str, label: str, check_only: bool) -> int:
    """比对并写入一个副本；返回 1（有过期）或 0。"""
    target.parent.mkdir(parents=True, exist_ok=True)
    if not target.exists() or target.read_text(encoding="utf-8") != content:
        print(f"过期: {target.relative_to(ROOT)}")
        if not check_only:
            target.write_text(content, encoding="utf-8")
            print(f"  已同步（{label}）")
        return 1
    return 0


def main() -> None:
    check_only = "--check" in sys.argv
    stale = 0
    for src in sorted(SRC.glob("*.md")):
        src_text = src.read_text(encoding="utf-8")
        meta, body = parse(src_text)

        stale += sync_one(ROOT / ".zcode" / "agents" / src.name, src_text, "原样复制", check_only)
        stale += sync_one(ROOT / ".claude" / "agents" / src.name, src_text, "原样复制", check_only)
        stale += sync_one(ROOT / ".codex" / "agents" / (src.stem + ".toml"), to_toml(meta, body), "md → TOML 转译", check_only)

    if stale == 0:
        print("全部同步。")
    elif check_only:
        print(f"{stale} 个副本过期，先跑 python tools/sync-agents.py")
        sys.exit(1)


if __name__ == "__main__":
    main()
