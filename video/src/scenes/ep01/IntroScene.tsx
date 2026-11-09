import type { FC } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { theme } from "../../theme";
import { useAnchors, usePalette, type SceneProps } from "../../scene-kit";

/**
 * 镜 0.1 · 系列引导片头（全系列每期标配，2026-11-04 导演拍板）
 * 台词三句对齐三段动画：品牌标 → 系列定位 → 本期预告卡，末尾渐暗接钩子镜黑场。
 * 台词文本与 EPxx.json 的 0.1 镜一致（引导句由 tts_qwen 段生成，时长由音频实测驱动）。
 * 主色/浅底从分类色板取（各期随 GoF 分类换色系），黑场底与文字用全系列恒定中性 token。
 */
export const IntroScene: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, at, atWord, fadeAt, popAt } = useAnchors(leadFrames, audioFrames);
  const palette = usePalette();

  // 品牌标下划线扫光：第一句（「大家好，这里是码上购」）期间 0 → 100%；
  // atWord 落首词「大家好」的 s，与旧 at(0)（首 chunk 起点）等值
  const underline = interpolate(
    frame,
    [atWord("大家好", 0), atWord("真实的工程现场", 0.35)],
    [0, 560],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }
  );
  // 收尾渐暗：第三句说完后整体压向黑场，衔接 1.1 钩子的 deepBg 开场。
  // at(1) 是语音末尾边界锚（读 align 末句 e 值，换轨自动重排；atWord 只能落词首，
  // 会比真实语音末尾早半秒，故边界锚保留 at 形式）
  const dim = interpolate(frame, [atWord("说起", 0.95), at(1)], [1, 0.15], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ backgroundColor: theme.deepBg, justifyContent: "center", alignItems: "center" }}
    >
      <div style={{ opacity: dim, display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* 第一句：品牌标 */}
        <div
          style={{
            fontSize: 120,
            fontWeight: 700,
            color: theme.text,
            letterSpacing: 16,
            opacity: popAt(atWord("大家好", 0.02)),
          }}
        >
          码上购<span style={{ color: palette.primaryBright }}>·设计模式</span>
        </div>
        <div
          style={{
            width: underline,
            height: 5,
            borderRadius: 3,
            backgroundColor: palette.primary,
            boxShadow: `0 0 24px ${palette.primary}`,
            marginTop: 18,
          }}
        />

        {/* 第二句：系列定位 */}
        <div
          style={{
            display: "flex",
            gap: 26,
            marginTop: 60,
            opacity: fadeAt(atWord("工程现场", 0.4)),
          }}
        >
          {["23 个 GoF 模式", "1 个真实电商系统", "25 期连载"].map((t) => (
            <span
              key={t}
              style={{
                fontSize: 27,
                color: theme.textMuted,
                border: `1px solid ${palette.surfaceBorder}`,
                borderRadius: 999,
                padding: "10px 26px",
                backgroundColor: palette.surface,
              }}
            >
              {t}
            </span>
          ))}
        </div>

        {/* 第三句：本期预告卡（事故从凌晨说起 → 时钟意象） */}
        <div
          style={{
            marginTop: 70,
            display: "flex",
            alignItems: "center",
            gap: 20,
            opacity: fadeAt(atWord("第一场", 0.7)),
          }}
        >
          <span style={{ fontSize: 40 }}>🕰️</span>
          <span style={{ fontSize: 34, color: theme.warn, fontWeight: 600 }}>
            EP01 单例 Singleton
          </span>
          <span style={{ fontSize: 27, color: theme.textMuted }}>第一场事故，从凌晨说起</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
