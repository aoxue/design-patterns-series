import type { FC } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { alpha, theme } from "../../theme";
import type { SceneProps } from "../../scene-kit";
import { usePalette } from "../../scene-kit";

/**
 * 镜 4.1 · 「框架影子」固定片头（8:02–8:09）
 * 系列记忆点：环形扫描光环 + 环节徽标 + 两个影子名字预告（每期同一套动效）。
 * v4.1 黑屏治理：场景动画从第 0 帧起跑（不等台词；首句实测 1.74s 才起音，
 * 原锚点让片头空黑 ~2.8s），光环扫满整镜、各元素前 2 秒内全部就位。
 */
export const Scene41Intro: FC<SceneProps> = ({ frames }) => {
  const frame = useCurrentFrame();
  const palette = usePalette();

  // 光环扫描：第 0 帧起转，整镜（lead+audio+tail）转完一圈
  const sweep = interpolate(frame, [0, frames], [0, 360], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });
  const sub = interpolate(frame, [0, 15], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const jdkLine = interpolate(frame, [18, 36], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const chips = interpolate(frame, [42, 62], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

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
            border: `2px solid ${palette.surfaceBorder}`,
            opacity: 0.5,
            transform: `rotate(${sweep + i * 180}deg)`,
            borderTopColor: palette.primaryBright,
          }}
        />
      ))}

      <div
        style={{
          fontSize: 30,
          color: theme.textMuted,
          letterSpacing: 10,
          opacity: sub,
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
          opacity: sub,
          textShadow: `0 0 60px ${alpha(palette.primary, 0.4)}`,
        }}
      >
        框架<span style={{ color: palette.primaryBright }}>影子</span>
      </div>

      <div
        style={{
          fontSize: 36,
          color: theme.textMuted,
          marginTop: 34,
          opacity: jdkLine,
        }}
      >
        它藏在 <span style={{ color: palette.primaryBright, fontFamily: theme.font.mono }}>JDK</span> 和{" "}
        <span style={{ color: theme.ok, fontFamily: theme.font.mono }}>Spring</span> 里，早就认识你
      </div>

      {/* 本期两个影子预告 */}
      <div style={{ display: "flex", gap: 28, marginTop: 70, opacity: chips }}>
        {["影子一号 · java.lang.Runtime", "影子二号 · Spring 容器"].map((t) => (
          <span
            key={t}
            style={{
              fontSize: 25,
              fontFamily: theme.font.mono,
              color: theme.text,
              border: `1px solid ${palette.surfaceBorder}`,
              borderRadius: 999,
              padding: "10px 28px",
              backgroundColor: alpha(palette.surface, 0.8),
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
