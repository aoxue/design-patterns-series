import type { FC } from "react";
import { theme } from "../theme";

export interface CodeSeg {
  text: string;
  kind?: "plain" | "comment" | "danger" | "kw";
}

export interface CodeLine {
  segs: CodeSeg[];
  /** null 表示空行分隔 */
  blank?: boolean;
  /** diff 行标记：删红 / 增绿（SOP §2：重构一律 diff 呈现） */
  diff?: "del" | "add";
}

interface CodeCardProps {
  title: string;
  lines: CodeLine[];
  /** 与 lines 等长：该行当前是否可见（由场景按时序计算） */
  visible: boolean[];
  /** 代码字号（默认 25；行数多/行长长的卡用 19–21 防溢出） */
  fontSize?: number;
}

const segColor = (kind?: string) => {
  if (kind === "comment") return theme.codeComment;
  if (kind === "danger") return theme.danger;
  if (kind === "kw") return theme.primaryBright;
  return theme.codePlain;
};

/** 代码卡：窗口栏 + 逐行显隐。PoC 用手工着色，全量版换 shiki 高亮 */
export const CodeCard: FC<CodeCardProps> = ({ title, lines, visible, fontSize = 25 }) => (
  <div
    style={{
      backgroundColor: theme.codeBg,
      border: `1px solid ${theme.surfaceBorder}`,
      borderRadius: 14,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    }}
  >
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "14px 20px",
        backgroundColor: theme.surface,
      }}
    >
      {theme.windowDots.map((c) => (
        <div key={c} style={{ width: 13, height: 13, borderRadius: "50%", backgroundColor: c }} />
      ))}
      <span
        style={{
          marginLeft: 12,
          fontFamily: theme.font.mono,
          fontSize: 20,
          color: theme.textMuted,
        }}
      >
        {title}
      </span>
    </div>
    <div
      style={{
        padding: "20px 26px",
        fontFamily: theme.font.mono,
        fontSize,
        lineHeight: 1.8,
      }}
    >
      {lines.map((line, i) =>
        line.blank ? (
          <div key={i} style={{ height: 20 }} />
        ) : (
          <div
            key={i}
            style={{
              opacity: visible[i] ? 1 : 0,
              transform: `translateY(${visible[i] ? 0 : 6}px)`,
              transition: "opacity 240ms, transform 240ms",
              whiteSpace: "pre",
              backgroundColor: !visible[i]
                ? "transparent"
                : line.diff === "del"
                  ? theme.diffDel
                  : line.diff === "add"
                    ? theme.diffAdd
                    : line.segs.some((s) => s.kind === "danger")
                      ? "rgba(255, 82, 82, 0.08)"
                      : "transparent",
              borderLeft: !visible[i]
                ? "3px solid transparent"
                : line.diff === "del"
                  ? `3px solid ${theme.danger}`
                  : line.diff === "add"
                    ? `3px solid ${theme.ok}`
                    : line.segs.some((s) => s.kind === "danger")
                      ? `3px solid ${theme.danger}`
                      : "3px solid transparent",
              paddingLeft: 10,
              ...(line.diff === "del" ? { textDecoration: "line-through", textDecorationColor: "rgba(255,82,82,0.55)" } : {}),
            }}
          >
            {line.segs.map((seg, j) => (
              <span key={j} style={{ color: segColor(seg.kind) }}>
                {seg.text}
              </span>
            ))}
          </div>
        )
      )}
    </div>
  </div>
);
