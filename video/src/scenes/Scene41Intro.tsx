import type { FC } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { theme } from "../theme";
import { useAnchors, type SceneProps } from "../scene-kit";

/**
 * 镜 4.1 · 「框架影子」固定片头（7:00–7:08）
 * 系列记忆点：环形扫描光环 + 环节徽标 + 两个影子名字预告（每期同一套动效）
 */
export const Scene41Intro: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, at, fade, pop } = useAnchors(leadFrames, audioFrames);

  // 光环扫描：0–100% 转一圈（8 秒片头内转完）
  const sweep = interpolate(frame, [at(0), at(1)], [0, 360], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });

  return (
    <AbsoluteFill
      style={{ backgroundColor: theme.deepBg, justifyContent: "center", alignItems: "center" }}
    >
      {/* 扫描光环（conic 渐变模拟：旋转的半透明扇环） */}
      {[300, 380].map((size, i) => (
        <div
          key={size}
          style={{
            position: "absolute",
            width: size,
            height: size,
            borderRadius: "50%",
            border: `2px solid ${theme.surfaceBorder}`,
            opacity: 0.5,
            transform: `rotate(${sweep + i * 180}deg)`,
            borderTopColor: theme.primaryBright,
          }}
        />
      ))}

      <div
        style={{
          fontSize: 30,
          color: theme.textMuted,
          letterSpacing: 10,
          opacity: fade(0.1),
          marginBottom: 30,
        }}
      >
        码上购 · 设计模式 · 固定环节
      </div>

      <div
        style={{
          fontSize: 110,
          fontWeight: 700,
          color: theme.text,
          letterSpacing: 14,
          opacity: pop(0.05),
          textShadow: `0 0 60px rgba(59, 130, 246, 0.4)`,
        }}
      >
        框架<span style={{ color: theme.primaryBright }}>影子</span>
      </div>

      <div
        style={{
          fontSize: 36,
          color: theme.textMuted,
          marginTop: 34,
          opacity: fade(0.3),
        }}
      >
        它藏在 <span style={{ color: theme.primaryBright, fontFamily: theme.font.mono }}>JDK</span> 和{" "}
        <span style={{ color: theme.ok, fontFamily: theme.font.mono }}>Spring</span> 里，早就认识你
      </div>

      {/* 本期两个影子预告 */}
      <div style={{ display: "flex", gap: 28, marginTop: 70, opacity: fade(0.55) }}>
        {["影子一号 · java.lang.Runtime", "影子二号 · Spring 容器"].map((t) => (
          <span
            key={t}
            style={{
              fontSize: 25,
              fontFamily: theme.font.mono,
              color: theme.text,
              border: `1px solid ${theme.surfaceBorder}`,
              borderRadius: 999,
              padding: "10px 28px",
              backgroundColor: "rgba(18, 44, 68, 0.8)",
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
