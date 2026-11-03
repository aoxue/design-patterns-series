import type { FC } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";
import { useAnchors, type SceneProps } from "../../scene-kit";

/**
 * 镜 1.4 · 本期路线图（1:15–1:30）
 * 「背八股」划掉（0.22）→ 「重新发明」章（0.44）
 * → 五版徽标随口播逐个报出（0.53–0.75），阶梯上升 + 演进箭头体现「渐进改进」
 * → 收尾「每一版，都是被现实毒打出来的」（0.92）
 * 锚点 = 台词字位（73 字），经 AnchorCtx 自动穿透 align.json 实测时间轴。
 */
const A = {
  bagu: 0.219, // 「不背八股」
  reinvent: 0.438, // 「重新发明」
  v: [0.534, 0.575, 0.616, 0.671, 0.753], // 饿汉/懒汉/双检锁/静态内部类/枚举
  beaten: 0.918, // 「被现实毒打」
};
const NAMES = ["饿汉式", "懒汉式", "双检锁", "静态内部类", "枚举"];

/** 阶梯几何：cx 等距、y 逐级上升（渐进感来自台阶 + 连线爬升） */
const CX = [240, 600, 960, 1320, 1680];
const CY = [620, 530, 440, 350, 260];

export const RoadmapScene: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { at, fade, pop } = useAnchors(leadFrames, audioFrames);

  const badgeIn = (i: number) => spring({ frame: frame - Math.round(at(A.v[i])), fps, config: { damping: 11 } });
  // 演进连线 i → i+1：随下一版被报出而「爬升」画出
  const segIn = (i: number) =>
    interpolate(frame, [at(A.v[i + 1]), at(A.v[i + 1]) + 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  // 「背八股」划线宽度（出现后 8 帧划穿）
  const strikeW = interpolate(frame, [at(A.bagu) + 4, at(A.bagu) + 12], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      {/* 顶部：标题 + 两枚状态章 */}
      <div
        style={{
          position: "absolute",
          top: 130,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 26,
        }}
      >
        <span style={{ fontSize: 30, color: theme.textMuted, letterSpacing: 4 }}>
          单例模式 · 五版演进
        </span>
        {/* 背八股 → 划掉（字幕说「不背八股」的同一拍） */}
        <span
          style={{
            position: "relative",
            fontSize: 27,
            color: theme.textMuted,
            border: `2px solid ${theme.surfaceBorder}`,
            borderRadius: 10,
            padding: "7px 20px",
            opacity: pop(A.bagu),
          }}
        >
          背八股
          <span
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              height: 3,
              width: `${strikeW}%`,
              backgroundColor: theme.danger,
              transform: "translate(-50%, -50%) rotate(-6deg)",
            }}
          />
        </span>
        {/* 重新发明章 */}
        <span
          style={{
            fontSize: 27,
            fontWeight: 700,
            color: theme.primaryBright,
            border: `2px solid ${theme.primary}`,
            borderRadius: 10,
            padding: "7px 20px",
            opacity: pop(A.reinvent),
            transform: `translateY(${(1 - pop(A.reinvent)) * 10}px)`,
          }}
        >
          重新发明它
        </span>
      </div>

      {/* 阶梯：徽标逐个报出，台阶逐级升高，连线爬升，渐进改进的视觉化 */}
      <svg viewBox="0 0 1920 720" width={1920} height={720} style={{ position: "absolute", top: 170, left: 0 }}>
        {/* 台阶踏板 */}
        {NAMES.map((_, i) => {
          const inn = badgeIn(i);
          return (
            <rect
              key={`step-${i}`}
              x={CX[i] - 105}
              y={CY[i] + 62}
              width={210}
              height={10}
              rx={5}
              fill={theme.surfaceBorder}
              opacity={inn * 0.9}
            />
          );
        })}
        {/* 演进连线（带箭头）：下一版报出时画出 */}
        {[0, 1, 2, 3].map((i) => {
          const t = segIn(i);
          if (t <= 0) return null;
          const x1 = CX[i] + 95;
          const y1 = CY[i] + 10;
          const x2 = CX[i + 1] - 100;
          const y2 = CY[i + 1] + 22;
          const len = Math.hypot(x2 - x1, y2 - y1);
          return (
            <g key={`seg-${i}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={theme.primary}
                strokeWidth={4}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - t}
                opacity={0.85}
              />
              {t > 0.95 && (
                <polygon
                  points={`${x2},${y2} ${x2 - 18},${y2 + 2} ${x2 - 8},${y2 + 16}`}
                  fill={theme.primary}
                  opacity={0.85}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* 徽标 + 版本名（随口播逐个弹出） */}
      {NAMES.map((name, i) => {
        const inn = badgeIn(i);
        const isLast = i === 4;
        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: CX[i] + 170 - 75,
              top: CY[i] + 170 - 55,
              width: 150,
              textAlign: "center",
              opacity: inn,
              transform: `translateY(${(1 - inn) * 26}px)`,
            }}
          >
            <div
              style={{
                width: 116,
                height: 116,
                margin: "0 auto",
                borderRadius: "50%",
                border: `4px solid ${isLast ? theme.ok : theme.primary}`,
                backgroundColor: isLast ? "rgba(63, 218, 140, 0.14)" : "rgba(59, 130, 246, 0.14)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontFamily: theme.font.mono,
                fontSize: 34,
                color: isLast ? theme.ok : theme.primaryBright,
                boxShadow: `0 0 34px ${isLast ? "rgba(63, 218, 140, 0.30)" : "rgba(59, 130, 246, 0.25)"}`,
              }}
            >
              V{i + 1}
            </div>
            <div style={{ fontSize: 28, color: theme.text, marginTop: 14, fontWeight: isLast ? 700 : 400 }}>
              {name}
            </div>
          </div>
        );
      })}

      {/* 收尾：与台词最后一拍同步 */}
      <div
        style={{
          position: "absolute",
          bottom: 150,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 44,
          fontWeight: 700,
          color: theme.text,
          opacity: fade(A.beaten),
          transform: `translateY(${(1 - fade(A.beaten)) * 16}px)`,
        }}
      >
        每一版，都是被<span style={{ color: theme.warn }}>现实毒打</span>出来的
      </div>
    </AbsoluteFill>
  );
};
