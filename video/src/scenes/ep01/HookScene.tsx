import type { FC } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useVideoConfig } from "remotion";
import { theme } from "../../theme";
import { useAnchors, usePalette, type SceneProps } from "../../scene-kit";

/**
 * 镜 1.1 · 钩子（0:13–0:31）
 * 黑屏 → 红色 00:01 → 商品页/账单左右对撞 → 差值红圈 → 「凶手在代码里」
 * v4.1 锚点实测化：原绝对帧动画改挂 align.json 实测词位
 * （00:01 数字仍第 0 帧起跑消 leadSec 黑屏，其余节拍逐词锁定：
 *  同一件商品 4.5s / 两个价格 6.0s / 用户实付 9.3s / 差值圈 10.3s / 价格事故 11.3s）。
 */
export const HookScene: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, fps, atWord, fadeAt } = useAnchors(leadFrames, audioFrames);
  const palette = usePalette();

  const digitIn = spring({ frame, fps, config: { damping: 14 } });
  // 数字放大进场后，收小上移让位给对撞卡片。
  // 几何约定（transformOrigin 顶边中心）：收小后停靠 y=120（200-80），
  // 字高约 78px，与顶部信息行（40–70px）留 50px 间距，不再越出画面。
  // 收小时点 ≈ 00:01 念完（约 2.2s，chunk 字位）：数字退居背景、品牌段开始。
  const shrinkA = atWord("码上购", 0.2);
  const digitShrink = interpolate(frame, [shrinkA, shrinkA + 25], [1, 0.34], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const digitY = interpolate(frame, [shrinkA, shrinkA + 25], [0, -80], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const digitScale = (0.8 + digitIn * 0.2) * digitShrink;

  // 对撞卡：左卡踩「两个价格」（约 6.0s，商品页促销即将登场）、右卡踩「用户」（约 9.3s 实付段）
  const slide = (from: number) =>
    interpolate(frame, [from, from + 28], [-760, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    });
  const slideL = atWord("两个价格", 0.35);
  const slideR = atWord("用户", 0.6);

  // 差值红圈：踩「减了」（约 10.3s），「只减了 50」话音落前差值成圈
  const diffIn = spring({ frame: frame - Math.round(atWord("减了", 0.7)), fps, config: { damping: 9 } });
  const pulse = 1 + 0.05 * Math.sin(frame / 5);

  // 两行结论：line1 踩「同一件商品」（约 4.5s）、line2 踩「价格事故」（约 11.3s，v4.1 修 2.6s 早出）
  const line1 = fadeAt(atWord("同一件", 0.3), 20);
  const line2 = fadeAt(atWord("价格事故", 0.68), 20);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.deepBg, justifyContent: "center", alignItems: "center" }}>
      {/* 00:01 事故时间戳 */}
      <div
        style={{
          position: "absolute",
          fontFamily: theme.font.mono,
          fontSize: 190,
          fontWeight: 700,
          color: theme.alertRed,
          opacity: digitIn * (0.92 + 0.08 * Math.sin(frame / 2)),
          transformOrigin: "top center",
          transform: `translateY(${digitY}px) scale(${digitScale})`,
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
            backgroundColor: palette.surface,
            border: `1px solid ${palette.surfaceBorder}`,
            transform: `translateX(${slide(slideL)}px)`,
          }}
        >
          <div style={{ fontSize: 24, color: theme.textMuted, marginBottom: 14 }}>商品页 · 促销标签</div>
          <div style={{ fontSize: 60, fontWeight: 700, color: theme.text }}>满 300 <span style={{ color: palette.primaryBright }}>减 80</span></div>
        </div>

        <div
          style={{
            width: 540,
            padding: "34px 40px",
            borderRadius: 20,
            backgroundColor: palette.surface,
            border: `1px solid ${palette.surfaceBorder}`,
            transform: `translateX(${-slide(slideR)}px)`,
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
        价格事故，凶手在代码里
      </div>
    </AbsoluteFill>
  );
};
