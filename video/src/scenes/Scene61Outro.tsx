import type { FC } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { theme } from "../theme";
import { useAnchors, type SceneProps } from "../scene-kit";

/**
 * 镜 6.1 · 一句话总结 + EP02 预告（9:30–10:00）
 * 金句全屏定格（兼作封面备选帧）→ 缩小让位给决策树速记 → EP02 teaser（switch 地狱 + 徽标）
 */
export const Scene61Outro: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, at, fade, pop, seen } = useAnchors(leadFrames, audioFrames);

  // 金句进场 → 0.24 处缩小上移让位给决策树（同 HookScene 数字让位手法）
  const quoteIn = pop(0.02);
  const quoteScale = interpolate(frame, [at(0.24), at(0.3)], [1, 0.42], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const quoteY = interpolate(frame, [at(0.24), at(0.3)], [0, -280], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  const tree = [
    { q: "Spring 项目", a: "注解 + 注入", p: 0.3 },
    { q: "裸 Java", a: "静态内部类起步", p: 0.36 },
    { q: "要防反射 / 序列化", a: "枚举封顶", p: 0.42 },
  ];

  // EP02 teaser：0.6 起 switch 代码一闪 + 徽标
  const teaserIn = pop(0.6);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.deepBg, justifyContent: "center", alignItems: "center" }}>
      {/* 金句全屏定格（封面备选帧） */}
      <div
        style={{
          position: "absolute",
          top: 300,
          textAlign: "center",
          opacity: quoteIn,
          transform: `scale(${quoteScale}) translateY(${quoteY}px)`,
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 700, color: theme.text, lineHeight: 1.5 }}>
          单例不是设计模式，
        </div>
        <div style={{ fontSize: 72, fontWeight: 700, color: theme.primaryBright, lineHeight: 1.5, marginTop: 10 }}>
          是全局变量的西装版。
        </div>
        <div style={{ fontSize: 32, color: theme.textMuted, marginTop: 44, opacity: fade(0.14) }}>
          穿之前想清楚：全局，真的是你要的吗？
        </div>
      </div>

      {/* 决策树速记卡（金句让位后浮现，靠左下——右下留给 EP02 预告） */}
      <div
        style={{
          position: "absolute",
          left: 130,
          bottom: 210,
          display: "flex",
          flexDirection: "column",
          gap: 16,
          opacity: fade(0.28),
        }}
      >
        <div style={{ fontSize: 24, color: theme.textMuted, textAlign: "center", marginBottom: 4 }}>
          真到了要写的那天 · 三秒走完
        </div>
        {tree.map((t) => (
          <div
            key={t.q}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              backgroundColor: "rgba(18, 44, 68, 0.85)",
              border: `1px solid ${theme.surfaceBorder}`,
              borderRadius: 12,
              padding: "14px 30px",
            }}
          >
            <span style={{ fontSize: 26, color: theme.text, width: 320 }}>{t.q}</span>
            <span style={{ fontSize: 24, color: theme.textMuted }}>→</span>
            <span style={{ fontSize: 26, color: theme.primaryBright, fontWeight: 700 }}>{t.a}</span>
          </div>
        ))}
      </div>

      {/* EP02 teaser */}
      {seen(0.58) && (
        <div
          style={{
            position: "absolute",
            right: 130,
            bottom: 210,
            width: 620,
            opacity: teaserIn,
            transform: `translateY(${(1 - teaserIn) * 30}px)`,
          }}
        >
          {/* switch 地狱一闪 */}
          <div
            style={{
              backgroundColor: theme.codeBg,
              border: `1px solid ${theme.surfaceBorder}`,
              borderRadius: 12,
              padding: "16px 22px",
              fontFamily: theme.font.mono,
              fontSize: 20,
              lineHeight: 1.8,
              color: theme.textMuted,
              marginBottom: 14,
              opacity: 0.9,
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
              gap: 18,
              border: `2px solid ${theme.primaryBright}`,
              borderRadius: 14,
              padding: "16px 26px",
              backgroundColor: "rgba(59, 130, 246, 0.12)",
            }}
          >
            <span style={{ fontFamily: theme.font.mono, fontSize: 30, fontWeight: 700, color: theme.primaryBright }}>
              EP02
            </span>
            <div>
              <div style={{ fontSize: 26, fontWeight: 700, color: theme.text }}>工厂方法</div>
              <div style={{ fontSize: 20, color: theme.textMuted }}>新增支付渠道，一行老代码不改 · 等你</div>
            </div>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
