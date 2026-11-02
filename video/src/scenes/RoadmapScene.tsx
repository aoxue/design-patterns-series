import type { FC } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

/**
 * 镜 1.4 · 本期路线图（1:15–1:30）
 * V1–V5 徽标依次点亮 → 「每一版都是被现实毒打出来的」
 */
const VERSIONS = ["饿汉式", "懒汉式", "双检锁", "静态内部类", "枚举"];

export const RoadmapScene: FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const lineW = interpolate(frame, [10, 70], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const nodeIn = (i: number) => spring({ frame: frame - (25 + i * 55), fps, config: { damping: 11 } });

  const footerIn = interpolate(frame, [330, 355], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const xs = VERSIONS.map((_, i) => 330 + i * 315);

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: 26, color: theme.textMuted, marginBottom: 90, letterSpacing: 4 }}>
        单例模式 · 五版演进 · 每一版都是被现实毒打出来的
      </div>

      <div style={{ position: "relative", width: 1560, height: 300 }}>
        {/* 连线 */}
        <div
          style={{
            position: "absolute",
            top: 60,
            left: 0,
            height: 4,
            width: `${lineW}%`,
            backgroundColor: theme.surfaceBorder,
            borderRadius: 2,
          }}
        />
        {VERSIONS.map((name, i) => {
          const inn = nodeIn(i);
          const active = i < 4; // 第五版留到正片压轴，这里只点亮
          return (
            <div
              key={name}
              style={{
                position: "absolute",
                left: xs[i],
                top: 0,
                width: 170,
                textAlign: "center",
                opacity: inn,
                transform: `translateX(-50%) scale(${0.85 + inn * 0.15})`,
              }}
            >
              <div
                style={{
                  width: 124,
                  height: 124,
                  borderRadius: "50%",
                  border: `4px solid ${active ? theme.primary : theme.surfaceBorder}`,
                  backgroundColor: active ? "rgba(59, 130, 246, 0.16)" : theme.surface,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontFamily: theme.font.mono,
                  fontSize: 34,
                  color: active ? theme.primaryBright : theme.textMuted,
                  margin: "0 auto",
                  boxShadow: active ? `0 0 44px rgba(59, 130, 246, 0.35)` : "none",
                }}
              >
                V{i + 1}
              </div>
              <div style={{ fontSize: 28, color: theme.text, marginTop: 20 }}>{name}</div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          fontSize: 44,
          fontWeight: 700,
          color: theme.text,
          marginTop: 60,
          opacity: footerIn,
          transform: `translateY(${(1 - footerIn) * 16}px)`,
        }}
      >
        这期不背八股，<span style={{ color: theme.primaryBright }}>重新发明它</span>
      </div>
    </AbsoluteFill>
  );
};
