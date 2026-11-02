import type { FC } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

/**
 * 镜 1.1 · 钩子（0:00–0:15）
 * 黑屏 → 红色 00:01 → 商品页/账单左右对撞 → 差值红圈 → 「凶手在代码里」
 */
export const HookScene: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const digitIn = spring({ frame, fps, config: { damping: 14 } });
  // 数字放大进场后，收小上移让位给对撞卡片
  const digitScale = interpolate(frame, [70, 95], [1, 0.34], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const digitY = interpolate(frame, [70, 95], [0, -300], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const slide = (from: number) =>
    interpolate(frame, [from, from + 28], [-760, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });

  const diffIn = spring({ frame: frame - 150, fps, config: { damping: 9 } });
  const pulse = 1 + 0.05 * Math.sin(frame / 5);

  const line1 = interpolate(frame, [195, 215], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const line2 = interpolate(frame, [285, 305], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#05070B", justifyContent: "center", alignItems: "center" }}>
      {/* 00:01 事故时间戳 */}
      <div
        style={{
          position: "absolute",
          fontFamily: theme.font.mono,
          fontSize: 190,
          fontWeight: 700,
          color: "#FF3B3B",
          opacity: digitIn * (0.92 + 0.08 * Math.sin(frame / 2)),
          transform: `scale(${0.8 + digitIn * 0.2 * digitScale}) translateY(${digitY}px)`,
          textShadow: "0 0 42px rgba(255, 59, 59, 0.55)",
          top: 200,
        }}
      >
        00:01
      </div>

      {/* 商品页 vs 支付账单 对撞 */}
      <div style={{ position: "absolute", top: 430, display: "flex", gap: 260, alignItems: "center" }}>
        <div
          style={{
            width: 540,
            padding: "34px 40px",
            borderRadius: 20,
            backgroundColor: theme.surface,
            border: `1px solid ${theme.surfaceBorder}`,
            transform: `translateX(${slide(85)}px)`,
          }}
        >
          <div style={{ fontSize: 24, color: theme.textMuted, marginBottom: 14 }}>商品页 · 促销标签</div>
          <div style={{ fontSize: 60, fontWeight: 700, color: theme.text }}>满 300 <span style={{ color: theme.primaryBright }}>减 80</span></div>
        </div>

        <div
          style={{
            width: 540,
            padding: "34px 40px",
            borderRadius: 20,
            backgroundColor: theme.surface,
            border: `1px solid ${theme.surfaceBorder}`,
            transform: `translateX(${-slide(100)}px)`,
          }}
        >
          <div style={{ fontSize: 24, color: theme.textMuted, marginBottom: 14 }}>支付账单 · 实付款</div>
          <div style={{ fontSize: 60, fontWeight: 700, color: theme.text }}>¥ 250.00</div>
          <div style={{ fontSize: 26, color: theme.warn, marginTop: 10 }}>只减了 50</div>
        </div>
      </div>

      {/* 差值红圈：与两侧卡片中线对齐，「差」小字 + 「30 元」大号两行排布 */}
      <div
        style={{
          position: "absolute",
          top: 420,
          width: 205,
          height: 205,
          borderRadius: "50%",
          border: `6px solid ${theme.danger}`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          paddingBottom: 10,
          color: theme.danger,
          backgroundColor: "rgba(5, 7, 11, 0.88)",
          transform: `scale(${diffIn * pulse})`,
          opacity: diffIn,
          boxShadow: `0 0 60px rgba(255, 82, 82, 0.35)`,
        }}
      >
        <span style={{ fontSize: 28, opacity: 0.9, marginBottom: 8 }}>差</span>
        <span style={{ fontSize: 50, fontWeight: 700, lineHeight: 1.1 }}>30 元</span>
      </div>

      <div style={{ position: "absolute", bottom: 200, fontSize: 40, color: theme.textMuted, opacity: line1, textAlign: "center", width: "100%" }}>
        同一个系统 · 两个价格
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 135,
          width: "100%",
          textAlign: "center",
          fontSize: 52,
          fontWeight: 700,
          color: theme.danger,
          opacity: line2,
          transform: `translateY(${(1 - line2) * 14}px)`,
        }}
      >
        价格事故 —— 凶手在代码里
      </div>
    </AbsoluteFill>
  );
};
