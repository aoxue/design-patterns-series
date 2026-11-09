import type { FC } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { CodeCard, type CodeLine } from "../../components/CodeCard";
import { alpha, theme } from "../../theme";
import { useAnchors, type SceneProps, usePalette } from "../../scene-kit";

/**
 * 镜 2.3b · V3 灵魂段：A2 指令重排时间轴全屏（3:40–4:33，v4 自旧 2.3 拆出）★ 本期截图页
 * 画面（脚本 v4 拆镜行）：三块积木 ① 分配内存 ② 初始化 ③ 指向；讲到「调换顺序」②③交换位次；
 * 线程 B 拿到半成品爆炸闪红；讲到「volatile 的作用」积木焊死回位（面板转绿 + 锁标）。
 * 与旧合并镜的差异：swap 语义修正为 0=正常序 / 1=重排序（旧版 DOM 恰好反相，
 * 「调换顺序」时序对不上讲解词），并按 2.3b 自己的台词字位重算全部锚点。
 */

/** 灵魂一行（C4 节选，volatile 呼吸高亮）：开头 15 秒的视觉锚 */
const VOLATILE_LINE: CodeLine[] = [
  {
    segs: [
      { text: "    private static " },
      { text: "volatile", kind: "danger", pulse: true },
      { text: " PromoConfigManager instance;" },
    ],
  },
];

/** 重排面板积木：步号、文本 */
const STEPS = [
  { n: "①", t: "分配内存" },
  { n: "②", t: "初始化对象" },
  { n: "③", t: "instance 指向内存" },
];

export const Scene23bReorder: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, atWord, fadeAt, popAt, seenAt } = useAnchors(leadFrames, audioFrames);
  const palette = usePalette();

  // 词位帧锚（fallback = 旧字符占比）。已避开 whisper 同音误差区：
  // volatile→Volato、非空→飞空、后建→后键，关键词均选转写实词
  const pulse1F = atWord("前面那个", 0.083); // 「instance 前面那个 volatile」引出灵魂词
  const boardF = atWord("三步", 0.284); // A2 面板随「是三步」入场
  const badgeF = atWord("动手脚", 0.168); // ⚠ JVM 真的会动手脚
  // 三步积木各等自己的词；「初始化」「指向」全镜各两次，occ 0 = 「三步」里那次
  const stepAt = [
    atWord("分配内存", 0.3),
    atWord("初始化", 0.336),
    atWord("指向", 0.388),
  ];
  const t2WaitF = atWord("多线程", 0.511); // 左面板 T2 等待行（单线程/多线程对比句）
  const boomF = atWord("高高兴兴", 0.63); // 线程 B 拿走半成品：右面板爆炸闪红
  const weldF = atWord("作用", 0.783); // 「volatile 的作用一句话」：焊死回位 + 面板转绿
  const shotF = atWord("截下来", 0.954); // 「把这张时间轴图截下来」截图提示

  const boardIn = fadeAt(boardF, 12);

  // ②③ 积木交换度：0=正常序 →「调换顺序：先指、后建」→ 1=重排序；
  // 讲到「volatile 的作用一句话」焊死回位，「禁止这个重排」收口
  const swap = interpolate(
    frame,
    [atWord("调换顺序", 0.456), atWord("先指", 0.471), weldF, atWord("禁止", 0.8)],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }
  );
  const early = interpolate(swap, [0.45, 0.8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const welded = seenAt(weldF); // 焊死后：面板转绿 + 锁标签
  // 线程 B 一查「非空！」：右面板爆炸闪红 12 帧脉冲（与 T2 拿走行同帧锁死）
  const boomT = frame - boomF;
  const boom = boomT > 0 && boomT < 14 ? 0.35 * Math.abs(Math.sin(boomT / 2.2)) : 0;
  const shotTip = popAt(shotF); // 截图提示

  return (
    <AbsoluteFill style={{ padding: "104px 120px 150px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 22, marginBottom: 18 }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: theme.text }}>
          <span style={{ fontFamily: theme.font.mono, color: palette.primaryBright }}>V3</span> 的灵魂：
          <span style={{ color: theme.danger }}>volatile</span> 防指令重排
        </div>
        <span
          style={{
            fontSize: 22,
            color: theme.warn,
            border: `1px solid ${theme.warn}`,
            borderRadius: 999,
            padding: "3px 16px",
            opacity: fadeAt(badgeF, 12),
          }}
        >
          ⚠ JVM 真的会动手脚
        </span>
      </div>

      {/* 灵魂一行代码条：volatile 呼吸高亮（两处提及各一个窗口） */}
      <div style={{ maxWidth: 1000 }}>
        <CodeCard
          title="PromoConfigManager.java · 灵魂所在的一行"
          lines={VOLATILE_LINE}
          revealAt={[0]}
          fontSize={24}
          pulseWindows={[
            [pulse1F - 6, boardF],
            [weldF, atWord("重排", 0.832) + 24],
          ]}
        />
      </div>

      {/* A2 时间轴（全屏宽，本期截图页）。
          截图强调只做「显色+光晕」（overlay 渐入），几何完全冻结（纪律：禁 padding/scale 强调） */}
      <div
        style={{
          display: "flex",
          gap: 32,
          marginTop: 26,
          flex: 1,
          opacity: boardIn,
          border: "2px solid transparent",
          borderRadius: 16,
          padding: 8,
          position: "relative",
        }}
      >
        {/* 截图强调层：边框显色 + 光晕，随台词渐入，零几何变化 */}
        <div
          style={{
            position: "absolute",
            inset: -2,
            border: `2px solid ${palette.primaryBright}`,
            borderRadius: 16,
            boxShadow: `0 0 34px ${alpha(palette.primaryBright, 0.1 + shotTip * 0.22)}`,
            opacity: fadeAt(shotF, 12),
            pointerEvents: "none",
          }}
        />

        {/* 左面板：正常顺序 */}
        <div
          style={{
            flex: 1,
            backgroundColor: theme.codeBg,
            border: `1px solid ${palette.surfaceBorder}`,
            borderRadius: 12,
            padding: "16px 26px",
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 700, color: theme.ok, marginBottom: 12 }}>正常顺序</div>
          {STEPS.map((s, i) => (
            <StepRow key={s.n} n={s.n} t={s.t} opacity={fadeAt(stepAt[i])} />
          ))}
          <div
            style={{
              fontSize: 24,
              fontFamily: theme.font.mono,
              color: theme.textMuted,
              marginTop: 10,
              opacity: fadeAt(t2WaitF),
            }}
          >
            T2 看到 null → 等待
          </div>
        </div>

        {/* 右面板：重排顺序（「调换顺序」时 ②③ 交换；volatile 焊死回位） */}
        <div
          style={{
            flex: 1,
            backgroundColor: theme.codeBg,
            border: `1px solid ${welded ? theme.ok : theme.danger}`,
            borderRadius: 12,
            padding: "16px 26px",
            position: "relative",
            boxShadow: welded ? "none" : `0 0 28px ${alpha(theme.danger, 0.12 + boom)}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 26, fontWeight: 700, color: theme.danger }}>
              重排顺序（无 volatile 时可能发生）
            </span>
            {welded && (
              <span
                style={{
                  fontSize: 22,
                  color: theme.ok,
                  border: `1px solid ${theme.ok}`,
                  borderRadius: 999,
                  padding: "2px 12px",
                  opacity: fadeAt(weldF),
                }}
              >
                🔒 volatile 焊死：禁止重排
              </span>
            )}
          </div>
          {STEPS.map((s, i) => {
            // 交换动画：②（i=1）下沉一位、③（i=2）上提一位（行高 48 + 缝 8 = 56）
            const dy = i === 1 ? swap * 56 : i === 2 ? -swap * 56 : 0;
            return (
              <div
                key={s.n}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  height: 48,
                  marginBottom: 8,
                  transform: `translateY(${dy}px)`,
                }}
              >
                <StepChip n={s.n} t={s.t} warn={i === 2 && early > 0.5} opacity={fadeAt(stepAt[i])} />
                {i === 2 && (
                  <span style={{ fontSize: 24, fontWeight: 700, color: theme.warn, opacity: early }}>← 提前！</span>
                )}
              </div>
            );
          })}
          <div
            style={{
              fontSize: 24,
              fontFamily: theme.font.mono,
              color: theme.danger,
              marginTop: 10,
              opacity: fadeAt(atWord("高高兴兴", 0.639)),
            }}
          >
            T2 看到"非空" → 直接拿走 → 半成品对象 → <span style={{ fontWeight: 700 }}>NPE 💥</span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** 积木行外壳（左面板用：纯淡入，无交换） */
const StepRow: FC<{ n: string; t: string; opacity: number }> = ({ n, t, opacity }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, height: 48, marginBottom: 8, opacity }}>
    <StepChip n={n} t={t} />
  </div>
);

/** 积木块本体：序号 + 文本胶囊（warn 态用于被提前的 ③） */
const StepChip: FC<{ n: string; t: string; warn?: boolean; opacity?: number }> = ({ n, t, warn, opacity = 1 }) => {
  const palette = usePalette();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, opacity }}>
      <span style={{ fontFamily: theme.font.mono, fontSize: 26, color: theme.textMuted, width: 36 }}>{n}</span>
      <span
        style={{
          fontSize: 26,
          color: warn ? theme.warn : theme.text,
          border: `1px solid ${warn ? theme.warn : palette.surfaceBorder}`,
          borderRadius: 8,
          padding: "6px 18px",
          backgroundColor: alpha(palette.bg, 0.8),
        }}
      >
        {t}
      </span>
    </div>
  );
};
