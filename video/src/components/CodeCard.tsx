import type { FC } from "react";
import { theme } from "../theme";

export interface CodeSeg {
  text: string;
  kind?: "plain" | "comment" | "danger";
}

export interface CodeLine {
  segs: CodeSeg[];
  /** null 表示空行分隔 */
  blank?: boolean;
}

interface CodeCardProps {
  title: string;
  lines: CodeLine[];
  /** 与 lines 等长：该行当前是否可见（由场景按时序计算） */
  visible: boolean[];
}

const segColor = (kind?: string) => {
  if (kind === "comment") return "#6B8CA8";
  if (kind === "danger") return theme.danger;
  return "#DCEBF7";
};

/** 代码卡：窗口栏 + 逐行显隐。PoC 用手工着色，全量版换 shiki 高亮 */
export const CodeCard: FC<CodeCardProps> = ({ title, lines, visible }) => (
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
      {["#FF5F57", "#FFBD2E", "#28CA42"].map((c) => (
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
        padding: "26px 30px",
        fontFamily: theme.font.mono,
        fontSize: 25,
        lineHeight: 2.0,
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
              backgroundColor:
                visible[i] && line.segs.some((s) => s.kind === "danger")
                  ? "rgba(255, 82, 82, 0.08)"
                  : "transparent",
              borderLeft:
                visible[i] && line.segs.some((s) => s.kind === "danger")
                  ? `3px solid ${theme.danger}`
                  : "3px solid transparent",
              paddingLeft: 10,
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
