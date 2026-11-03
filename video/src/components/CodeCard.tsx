import type { FC } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

export interface CodeSeg {
  text: string;
  kind?: "plain" | "comment" | "danger" | "kw";
  /** 呼吸+光晕标记：在 pulseWindows 任一窗口内随帧起伏，窗口外恢复常亮 */
  pulse?: boolean;
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
  /** 与 lines 等长：每行开始出现的帧号（Infinity = 暂不显示）。
   *  行在 revealAt 起 9 帧内确定性淡入 + 上浮——帧驱动，禁用 CSS transition
   *  （Remotion 逐帧截图下 transition 行为不确定，是「出现闪两下」的根源） */
  revealAt: number[];
  /** 代码字号（默认 25；行数多/行长长的卡用 19–21 防溢出） */
  fontSize?: number;
  /** 执行游标：该行处于「执行中」状态（▶ 前缀 + 高亮），与终端输出同步配对用 */
  activeLine?: number;
  /** 呼吸+光晕的帧窗口（起、止）：命中 pulse 标记的代码段在此窗口内呼吸 */
  pulseWindows?: [number, number][];
}

const segColor = (kind?: string) => {
  if (kind === "comment") return theme.codeComment;
  if (kind === "danger") return theme.danger;
  if (kind === "kw") return theme.primaryBright;
  return theme.codePlain;
};

/** 代码卡：窗口栏 + 逐行显隐。PoC 用手工着色，全量版换 shiki 高亮 */
export const CodeCard: FC<CodeCardProps> = ({
  title,
  lines,
  revealAt,
  fontSize = 25,
  activeLine = -1,
  pulseWindows,
}) => {
  const frame = useCurrentFrame();
  /** 呼吸强度 0–1：帧在窗口内时以 ~0.8s 周期正弦起伏，窗口外为 null（常亮） */
  const pulseK = (seg: CodeSeg): number | null => {
    if (!seg.pulse || !pulseWindows) return null;
    for (const [a, b] of pulseWindows) {
      if (frame >= a && frame <= b) {
        return 0.5 + 0.5 * Math.sin(frame / 3.8);
      }
    }
    return null;
  };
  /** 行出现进度 0–1：revealAt 起 9 帧淡入（Infinity 恒为 0） */
  const tOf = (i: number) =>
    revealAt[i] === Infinity
      ? 0
      : interpolate(frame, [revealAt[i], revealAt[i] + 9], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  return (
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
      {lines.map((line, i) => {
        if (line.blank) return <div key={i} style={{ height: 20 }} />;
        const t = tOf(i); // 帧驱动出现进度：底色/边条随行整体淡入，无跳变
        return (
          <div
            key={i}
            style={{
              opacity: t,
              transform: `translateY(${(1 - t) * 10}px)`,
              whiteSpace: "pre",
              backgroundColor:
                i === activeLine
                  ? "rgba(124, 182, 255, 0.12)"
                  : t <= 0
                    ? "transparent"
                    : line.diff === "del"
                      ? theme.diffDel
                      : line.diff === "add"
                        ? theme.diffAdd
                        : line.segs.some((s) => s.kind === "danger")
                          ? "rgba(255, 82, 82, 0.08)"
                          : "transparent",
              borderLeft:
                i === activeLine
                  ? `3px solid ${theme.primaryBright}`
                  : t <= 0
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
            {i === activeLine && (
              <span style={{ color: theme.primaryBright, marginRight: 8 }}>▶</span>
            )}
            {line.segs.map((seg, j) => {
              const k = pulseK(seg);
              return (
                <span
                  key={j}
                  style={{
                    color: segColor(seg.kind),
                    opacity: k == null ? 1 : 0.55 + 0.45 * k,
                    textShadow:
                      k == null
                        ? "none"
                        : `0 0 ${8 + 16 * k}px rgba(255, 82, 82, ${0.30 + 0.5 * k}), 0 0 ${20 + 30 * k}px rgba(255, 82, 82, ${0.15 + 0.3 * k})`,
                  }}
                >
                  {seg.text}
                </span>
              );
            })}
          </div>
        );
      })}
    </div>
  </div>
  );
};
