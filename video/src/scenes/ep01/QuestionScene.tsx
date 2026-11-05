import type { FC } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";
import { usePalette } from "../../scene-kit";

/**
 * 镜 1.3 · 转折（0:50–1:15）
 * 三个实例各亮出自己缓存的折扣值（订单是新值 80，支付/报表还是旧值 50）
 * + 每张卡「new ✓」绿标（代码没错）→ 「谁是权威？」→ 约束打字机 → 「谁来焊死？」
 */
const INSTANCES = [
  { label: "订单", value: "减 80", fresh: true }, // 运营改完后刷新到的新值
  { label: "支付", value: "减 50", fresh: false }, // 还停在旧值，价格事故的根源
  { label: "报表", value: "减 50", fresh: false },
];

export const QuestionScene: FC = () => {
  const frame = useCurrentFrame();
  const palette = usePalette();
  const { fps } = useVideoConfig();

  const cardIn = (i: number) => spring({ frame: frame - (30 + i * 60), fps, config: { damping: 12 } });
  const chipIn = (i: number) => spring({ frame: frame - (80 + i * 60), fps, config: { damping: 10 } });
  const authIn = interpolate(frame, [240, 265], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const typeStart = 330;
  const typed = Math.max(0, Math.min(Math.floor((frame - typeStart) / 2), "约束：全系统只允许一个实例".length));
  const line2In = interpolate(frame, [480, 505], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", gap: 60, marginBottom: 90 }}>
        {INSTANCES.map((ins, i) => (
          <div key={ins.label} style={{ textAlign: "center" }}>
            <div
              style={{
                width: 260,
                height: 260,
                borderRadius: 26,
                border: `3px dashed ${theme.danger}`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                gap: 18,
                opacity: cardIn(i),
                transform: `scale(${cardIn(i)})`,
                position: "relative",
              }}
            >
              {/* 角标：这行 new 没有写错 */}
              <div
                style={{
                  position: "absolute",
                  top: -16,
                  right: -16,
                  fontFamily: theme.font.mono,
                  fontSize: 22,
                  color: theme.ok,
                  border: `2px solid ${theme.ok}`,
                  borderRadius: 999,
                  padding: "4px 14px",
                  backgroundColor: palette.bg,
                }}
              >
                new ✓
              </div>

              <div style={{ fontSize: 22, color: theme.textMuted }}>自己的缓存</div>
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 700,
                  fontFamily: theme.font.mono,
                  color: ins.fresh ? theme.ok : theme.warn,
                  border: `2px solid ${ins.fresh ? theme.ok : theme.warn}`,
                  borderRadius: 14,
                  padding: "6px 26px",
                  opacity: chipIn(i),
                  transform: `scale(${0.8 + chipIn(i) * 0.2})`,
                }}
              >
                {ins.value}
              </div>
            </div>
            <div style={{ fontSize: 26, color: theme.textMuted, marginTop: 16 }}>实例 · {ins.label}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          fontSize: 32,
          color: theme.text,
          opacity: authIn,
          transform: `translateY(${(1 - authIn) * 14}px)`,
          marginBottom: 40,
        }}
      >
        同一个类 · 三个「自己」，<span style={{ color: theme.warn, fontWeight: 700 }}>谁是权威？</span>
      </div>

      <div style={{ fontSize: 58, fontWeight: 700, color: theme.text, height: 80 }}>
        {"约束：全系统只允许一个实例".slice(0, typed)}
        <span style={{ color: palette.primaryBright, opacity: Math.sin(frame / 4) > 0 ? 1 : 0 }}>|</span>
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
        谁来把它焊死在代码里？
      </div>
    </AbsoluteFill>
  );
};
