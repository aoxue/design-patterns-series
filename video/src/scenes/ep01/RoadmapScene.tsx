import type { FC } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { alpha, theme } from "../../theme";
import { useAnchors, usePalette, type SceneProps } from "../../scene-kit";
import { ChapterMark } from "../../components/ChapterMark";

/**
 * 镜 1.4 · 章节登场卡 + 五版路线图（1:26–1:42，v4.1 重排）
 * 大字「单例模式 Singleton」中心登场（踩「单例模式」实测词位 ≈2.4s）
 * → 「不背八股」划掉（4.6s）→「重新发明它」章（7.5s）
 * → 五版报出（饿汉…枚举 ≈9.0–11.8s）时大字缩小飞入左上、由 ChapterMark 接棒常驻，
 *    V1–V5 徽标随报出逐个点亮。
 * 路线图整体收窄（CX 间距 300、纵向步进 65），V5 圆圈右缘 ≤1620px，修原 1850px 近越界。
 */
const NAMES = ["饿汉式", "懒汉式", "双检锁", "静态内部类", "枚举"];

/** 阶梯几何（svg viewBox 1920×460，位于页面 top 250）：cx 等距、y 逐级上升 */
const CX = [330, 630, 930, 1230, 1530];
const CY = [340, 275, 210, 145, 80];
const CIRCLE = 104;

export const RoadmapScene: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, atWord, fadeAt, popAt } = useAnchors(leadFrames, audioFrames);
  const palette = usePalette();

  // 实测锚点：单例模式 2.35 / 不背八股 4.63 / 重新发明 7.51 / 五版 9.03–11.79 / 现实毒打 13.85
  const heroF = atWord("单例模式", 0.03);
  const baguF = atWord("不背八股", 0.22);
  const reinventF = atWord("重新发明", 0.44);
  // 五版报出词位：whisper 同音误差下词级优先命中、chunk 字位兜底（偏差 <1s）
  const vF = [
    atWord("汉、", 0.52, 0),
    atWord("汉、", 0.565, 1),
    atWord("锁、", 0.61),
    atWord("静态", 0.65),
    atWord("举", 0.72),
  ];
  const dockF = vF[0]; // 报出第一版即开始停靠
  const beatenF = atWord("现实", 0.9);

  const badgeIn = (i: number) => popAt(vF[i]);
  // 演进连线 i → i+1：随下一版被报出而「爬升」画出
  const segIn = (i: number) =>
    interpolate(frame, [vF[i + 1], vF[i + 1] + 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  // 「背八股」划线宽度（出现后 8 帧划穿）
  const strikeW = interpolate(frame, [baguF + 4, baguF + 12], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 大字 → 左上停靠：位移+缩放（16 帧），尾段与 ChapterMark 交叉淡化
  const dock = interpolate(frame, [dockF, dockF + 16], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const heroX = interpolate(dock, [0, 1], [0, -760]);
  const heroY = interpolate(dock, [0, 1], [0, -262]);
  const heroScale = interpolate(dock, [0, 1], [1, 0.3]);
  const heroOut = interpolate(dock, [0.82, 1], [1, 0]);
  const markIn = interpolate(dock, [0.82, 1], [0, 1]);
  const enOut = 1 - Math.min(dock * 2, 1); // 副标「Singleton」随飞 docking 渐隐

  return (
    <AbsoluteFill>
      {/* 停靠后的章节标（EP 系列可复用样式） */}
      <ChapterMark cn="单例模式" en="Singleton" opacity={markIn} />

      {/* 登场大字：中心弹出 → 缩小飞入左上（位置由 dock 插值驱动，文字不换行） */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 330,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          opacity: popAt(heroF) * heroOut,
          transform: `translate(${heroX}px, ${heroY}px) scale(${heroScale})`,
        }}
      >
        <div style={{ fontSize: 110, fontWeight: 700, color: theme.text, letterSpacing: 12 }}>
          单例<span style={{ color: palette.primaryBright }}>模式</span>
        </div>
        <div
          style={{
            fontSize: 34,
            color: theme.textMuted,
            fontFamily: theme.font.mono,
            letterSpacing: 10,
            marginTop: 18,
            opacity: enOut,
          }}
        >
          Singleton
        </div>
      </div>

      {/* 顶部两枚状态章（居中，与左上章节标不撞） */}
      <div
        style={{
          position: "absolute",
          top: 108,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 26,
        }}
      >
        {/* 背八股 → 划掉（字幕说「不背八股」的同一拍） */}
        <span
          style={{
            position: "relative",
            fontSize: 27,
            color: theme.textMuted,
            border: `2px solid ${palette.surfaceBorder}`,
            borderRadius: 10,
            padding: "7px 20px",
            opacity: popAt(baguF),
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
            color: palette.primaryBright,
            border: `2px solid ${palette.primary}`,
            borderRadius: 10,
            padding: "7px 20px",
            opacity: popAt(reinventF),
            transform: `translateY(${(1 - popAt(reinventF)) * 10}px)`,
          }}
        >
          重新发明它
        </span>
      </div>

      {/* 阶梯：徽标逐个报出，台阶逐级升高，连线爬升，渐进改进的视觉化（v4.1 整体收窄居中） */}
      <svg viewBox="0 0 1920 460" width={1920} height={460} style={{ position: "absolute", top: 250, left: 0 }}>
        {/* 台阶踏板 */}
        {NAMES.map((_, i) => {
          const inn = badgeIn(i);
          return (
            <rect
              key={`step-${i}`}
              x={CX[i] - 100}
              y={CY[i] + 58}
              width={200}
              height={10}
              rx={5}
              fill={palette.surfaceBorder}
              opacity={inn * 0.9}
            />
          );
        })}
        {/* 演进连线（带箭头）：下一版报出时画出 */}
        {[0, 1, 2, 3].map((i) => {
          const t = segIn(i);
          if (t <= 0) return null;
          const x1 = CX[i] + 88;
          const y1 = CY[i] + 8;
          const x2 = CX[i + 1] - 96;
          const y2 = CY[i + 1] + 20;
          return (
            <g key={`seg-${i}`}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={palette.primary}
                strokeWidth={4}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - t}
                opacity={0.85}
              />
              {t > 0.95 && (
                <polygon
                  points={`${x2},${y2} ${x2 - 18},${y2 + 2} ${x2 - 8},${y2 + 16}`}
                  fill={palette.primary}
                  opacity={0.85}
                />
              )}
            </g>
          );
        })}
      </svg>

      {/* 徽标 + 版本名（随口播逐个弹出；圆心页面 y = 250 + CY） */}
      {NAMES.map((name, i) => {
        const inn = badgeIn(i);
        const isLast = i === 4;
        return (
          <div
            key={name}
            style={{
              position: "absolute",
              left: CX[i] - 75,
              top: 250 + CY[i] - CIRCLE / 2,
              width: 150,
              textAlign: "center",
              opacity: inn,
              transform: `translateY(${(1 - inn) * 26}px)`,
            }}
          >
            <div
              style={{
                width: CIRCLE,
                height: CIRCLE,
                margin: "0 auto",
                borderRadius: "50%",
                border: `4px solid ${isLast ? theme.ok : palette.primary}`,
                backgroundColor: isLast ? "rgba(63, 218, 140, 0.14)" : alpha(palette.primary, 0.14),
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontFamily: theme.font.mono,
                fontSize: 31,
                color: isLast ? theme.ok : palette.primaryBright,
                boxShadow: `0 0 34px ${isLast ? "rgba(63, 218, 140, 0.30)" : alpha(palette.primary, 0.25)}`,
              }}
            >
              V{i + 1}
            </div>
            <div style={{ fontSize: 27, color: theme.text, marginTop: 12, fontWeight: isLast ? 700 : 400 }}>
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
          opacity: fadeAt(beatenF),
          transform: `translateY(${(1 - fadeAt(beatenF)) * 16}px)`,
        }}
      >
        每一版，都是被<span style={{ color: theme.warn }}>现实毒打</span>出来的
      </div>

      {/* 「单例模式 · 五版演进」小注：停靠完成后由章节标接管语义，此处改为阶梯区脚注 */}
      <div
        style={{
          position: "absolute",
          top: 208,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 24,
          color: theme.textMuted,
          letterSpacing: 4,
          opacity: markIn,
        }}
      >
        单例模式 · 五版演进
      </div>
    </AbsoluteFill>
  );
};
