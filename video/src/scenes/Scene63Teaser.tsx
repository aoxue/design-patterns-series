import type { FC } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { theme } from "../theme";
import { useAnchors, type SceneProps } from "../scene-kit";
import { QuoteFrame } from "../components/QuoteFrame";

/**
 * 镜 6.3 · EP02 预告 + 金句回屏（结尾三镜压轴）
 * switch 地狱卡随台词（0.23）弹入，EP02 徽标随钩子文案（0.42）弹入；
 * 台词落定（at(1)＝实测语音末尾）后 teaser 淡出、金句放大回屏定格到片尾——与 6.1 首尾呼应，末帧即封面备选帧。
 */
export const Scene63Teaser: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, at, pop } = useAnchors(leadFrames, audioFrames);

  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  // 收束动作：语音一落 teaser 让位（0.6s），金句 0.85s 内回屏，余下 ~2s 静止定格（tailSec 3s）
  const teaserOut = interpolate(frame, [at(1), at(1) + 18], [1, 0], clamp);
  const quoteIn = interpolate(frame, [at(1), at(1) + 25], [0, 1], clamp);
  const quoteScale = interpolate(frame, [at(1), at(1) + 25], [0.92, 1], clamp);

  const switchIn = pop(0.23);
  const badgeIn = pop(0.42);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.deepBg, justifyContent: "center", alignItems: "center" }}>
      {/* EP02 teaser：语音结束前居中展示 */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
          opacity: teaserOut,
        }}
      >
        {/* switch 地狱一闪 */}
        <div
          style={{
            backgroundColor: theme.codeBg,
            border: `1px solid ${theme.surfaceBorder}`,
            borderRadius: 12,
            padding: "18px 26px",
            fontFamily: theme.font.mono,
            fontSize: 22,
            lineHeight: 1.8,
            color: theme.textMuted,
            opacity: switchIn,
            transform: `translateY(${(1 - switchIn) * 26}px)`,
          }}
        >
          <div>switch (channelType) {"{"}</div>
          <div style={{ color: theme.warn }}>{"  case \"ALIPAY\": … case \"WECHAT\": …"}</div>
          <div>{"  case \"UNIONPAY\": /* 云闪付来了! */"}</div>
          <div>{"}"}</div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            border: `2px solid ${theme.primaryBright}`,
            borderRadius: 14,
            padding: "18px 30px",
            backgroundColor: "rgba(59, 130, 246, 0.12)",
            opacity: badgeIn,
            transform: `translateY(${(1 - badgeIn) * 26}px)`,
          }}
        >
          <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 700, color: theme.primaryBright }}>
            EP02
          </span>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, color: theme.text }}>工厂方法</div>
            <div style={{ fontSize: 21, color: theme.textMuted }}>新增支付渠道，一行老代码不改 · 等你</div>
          </div>
        </div>
      </div>

      {/* 金句回屏：压轴定格（与 6.1 同构，末帧兼作封面备选） */}
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center" }}>
        <QuoteFrame opacity={quoteIn} scale={quoteScale} />
      </div>
    </AbsoluteFill>
  );
};
