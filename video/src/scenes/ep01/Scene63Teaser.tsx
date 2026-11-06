import type { FC } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { alpha, theme } from "../../theme";
import { useAnchors, type SceneProps, usePalette } from "../../scene-kit";
import { QuoteFrame } from "../../components/QuoteFrame";

/**
 * 镜 6.3 · EP02 预告 + 金句回屏（结尾三镜压轴）
 * v4.1 黑屏治理：switch 地狱卡从第 0 帧弹入（原 pop(0.23) 要等到 ≈3.4s，
 * teaser 开头空黑 3 秒+），EP02 徽标仍踩「工厂方法」实测词位（≈7.8s）；
 * 台词落定（at(1)＝实测语音末尾）后 teaser 淡出、金句放大回屏定格到片尾，与 6.1 首尾呼应，末帧即封面备选帧。
 */
export const Scene63Teaser: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, at, atWord, popAt } = useAnchors(leadFrames, audioFrames);
  const palette = usePalette();

  const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  // 收束动作：语音一落 teaser 让位（0.6s），金句 0.85s 内回屏，余下 ~2s 静止定格（tailSec 3s）
  const teaserOut = interpolate(frame, [at(1), at(1) + 18], [1, 0], clamp);
  const quoteIn = interpolate(frame, [at(1), at(1) + 25], [0, 1], clamp);
  const quoteScale = interpolate(frame, [at(1), at(1) + 25], [0.92, 1], clamp);

  const switchIn = popAt(2); // 第 0 帧起跑（lead 期间即开画），台词「下期」几乎同时
  const badgeIn = popAt(atWord("工厂方法", 0.42));

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
            border: `1px solid ${palette.surfaceBorder}`,
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
            border: `2px solid ${palette.primaryBright}`,
            borderRadius: 14,
            padding: "18px 30px",
            backgroundColor: alpha(palette.primary, 0.12),
            opacity: badgeIn,
            transform: `translateY(${(1 - badgeIn) * 26}px)`,
          }}
        >
          <span style={{ fontFamily: theme.font.mono, fontSize: 32, fontWeight: 700, color: palette.primaryBright }}>
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
