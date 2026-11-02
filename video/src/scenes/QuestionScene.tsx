import type { FC } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

/**
 * 镜 1.3 · 转折（0:50–1:15）
 * 三个实例卡片打问号 → 「约束：全系统只有一个实例」打字机 → 「谁来焊死？」
 */
export const QuestionScene: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const cardIn = (i: number) => spring({ frame: frame - (30 + i * 60), fps, config: { damping: 12 } });
  const strikeW = interpolate(frame, [230, 265], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const noWrongIn = interpolate(frame, [270, 292], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const typeStart = 330;
  const typed = Math.max(0, Math.min(Math.floor((frame - typeStart) / 2), "约束：全系统只允许一个实例".length));
  const line2In = interpolate(frame, [480, 505], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: 60, marginBottom: 110 }}>
        {["订单", "支付", "报表"].map((label, i) => (
          <div key={label} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 250,
                height: 250,
                borderRadius: 26,
                border: `3px dashed ${theme.danger}`,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 110,
                color: theme.danger,
                opacity: cardIn(i),
                transform: `scale(${cardIn(i)})`,
                position: "relative",
              }}
            >
              ？
              {/* 「没有一行写错」的视觉记号：三卡上划红线 */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  height: 4,
                  width: `${strikeW}%`,
                  backgroundColor: theme.danger,
                  transform: "translate(-50%, -50%) rotate(-8deg)",
                }}
              />
            </div>
            <div style={{ fontSize: 26, color: theme.textMuted, marginTop: 16 }}>实例 · {label}</div>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 30, color: theme.textMuted, opacity: noWrongIn, marginBottom: 40 }}>
        没有一行代码写错 —— 缺的是一个机制
      </div>

      <div style={{ fontSize: 58, fontWeight: 700, color: theme.text, height: 80 }}>
        {"约束：全系统只允许一个实例".slice(0, typed)}
        <span style={{ color: theme.primaryBright, opacity: Math.sin(frame / 4) > 0 ? 1 : 0 }}>|</span>
      </div>

      <div
        style={{
          fontSize: 42,
          color: theme.warn,
          marginTop: 30,
          opacity: line2In,
          transform: `translateY(${(1 - line2In) * 16}px)`,
        }}
      >
        —— 谁来把它焊死在代码里？
      </div>
    </AbsoluteFill>
  );
};
