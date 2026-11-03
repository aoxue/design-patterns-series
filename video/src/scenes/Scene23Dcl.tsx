import type { FC } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { CodeCard, type CodeLine } from "../components/CodeCard";
import { theme } from "../theme";
import { useAnchors, type SceneProps } from "../scene-kit";

/**
 * 镜 2.3 · V3 双检锁 DCL + 动画板 A2 指令重排（2:50–3:50）★ 本期视觉亮点
 * 上：C4 四步口诀逐段显形；下：A2 时间轴，正常顺序 vs 重排顺序，
 * ②③ 积木交换 → 线程 B 拿走半成品 NPE → volatile 焊死回位
 */
const LINES: CodeLine[] = [
  { segs: [{ text: "public class PromoConfigManager {" }] },
  {
    segs: [
      { text: "    private static " },
      { text: "volatile", kind: "danger", pulse: true },
      { text: " PromoConfigManager " },
      { text: "instance", kind: "kw" },
      { text: ";        // volatile：防指令重排", kind: "comment" },
    ],
  },
  { segs: [{ text: "    private PromoConfigManager() { refresh(); }" }] },
  { segs: [{ text: "    public static PromoConfigManager getInstance() {" }] },
  {
    segs: [
      { text: "        if (instance == null) {                  // " },
      { text: "一查：无锁，挡掉绝大多数", kind: "comment" },
    ],
  },
  {
    segs: [
      { text: "            " },
      { text: "synchronized", kind: "kw" },
      { text: " (PromoConfigManager.class) {   // " },
      { text: "加锁", kind: "comment" },
    ],
  },
  {
    segs: [
      { text: "                if (instance == null) {          // " },
      { text: "二查：拿到锁再确认", kind: "comment" },
    ],
  },
  {
    segs: [
      { text: "                    instance = " },
      { text: "new PromoConfigManager()", kind: "danger" },
      { text: ";      // " },
      { text: "创建", kind: "comment" },
    ],
  },
  { segs: [{ text: "                }" }] },
  { segs: [{ text: "            }" }] },
  { segs: [{ text: "        }" }] },
  { segs: [{ text: "        return instance;" }] },
  { segs: [{ text: "    }" }] },
  { segs: [{ text: "}" }] },
];

// 代码各行出现的台词进度：volatile 声明 → 一查 → 加锁 → 二查 → 创建 → 收尾
const VIS = [0.04, 0.05, 0.06, 0.07, 0.08, 0.15, 0.21, 0.23, 0.24, 0.245, 0.25, 0.255, 0.26, 0.265];

/** 重排面板积木：步号、文本、正常序 y 位次 */
const STEPS = [
  { n: "①", t: "分配内存" },
  { n: "②", t: "初始化对象" },
  { n: "③", t: "instance 指向内存" },
];

export const Scene23Dcl: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, at, fade, pop, seen } = useAnchors(leadFrames, audioFrames);

  const revealAt = VIS.map(at);
  const boardIn = fade(0.34);

  // ②③ 积木交换度：0.42 讲到「调换顺序」交换 → 0.60 volatile 焊死回位
  const swap = interpolate(
    frame,
    [at(0.42), at(0.46), at(0.6), at(0.64)],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) }
  );
  const welded = seen(0.62); // 焊死后：面板转绿 + 锁标签
  // NPE 爆炸闪红：0.50 起 12 帧脉冲
  const boomT = frame - at(0.5);
  const boom = boomT > 0 && boomT < 14 ? 0.35 * Math.abs(Math.sin(boomT / 2.2)) : 0;
  const shotTip = pop(0.76); // 「本期最值钱的一页」截图提示

  const motto = ["一查", "加锁", "二查", "创建"];
  const mottoAt = [0.08, 0.15, 0.21, 0.23];

  return (
    <AbsoluteFill style={{ padding: "96px 90px 140px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 22, marginBottom: 14 }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: theme.text }}>
          <span style={{ fontFamily: theme.font.mono, color: theme.primaryBright }}>V3</span> 双检锁 DCL
          <span style={{ fontSize: 22, fontWeight: 400, color: theme.textMuted, marginLeft: 12 }}>
            Double-Checked Locking
          </span>
        </div>
        {/* 口诀四步：随台词点亮 */}
        {motto.map((m, i) => (
          <span
            key={m}
            style={{
              fontSize: 23,
              fontFamily: theme.font.mono,
              color: seen(mottoAt[i]) ? theme.primaryBright : theme.textMuted,
              border: `1px solid ${seen(mottoAt[i]) ? theme.primary : theme.surfaceBorder}`,
              borderRadius: 999,
              padding: "3px 16px",
              opacity: seen(mottoAt[i]) ? 1 : 0.45,
            }}
          >
            {i + 1}. {m}
          </span>
        ))}
      </div>

      {/* 上：C4 代码卡（小字号防溢出 + 禁止被 flex 压缩裁行） */}
      <div style={{ flexShrink: 0 }}>
        <CodeCard
          title="PromoConfigManager.java · V3 双检锁"
          lines={LINES}
          revealAt={revealAt}
          fontSize={19}
          pulseWindows={[
            [at(0.301), at(0.378) + 6], // 「但这段代码真正的灵魂，是…volatile」
            [at(0.849), at(0.898) + 6], // 「volatile 的作用一句话：禁止这个重排」
          ]}
        />
      </div>

      {/* 下：A2 指令重排时间轴（全屏宽，本期截图页）。
          截图强调只做「显色+光晕」（overlay 渐入），几何完全冻结，
          曾经 padding 10→8 + scale 0.985→1 造成卡片可见的尺寸跳变，已废除 */}
      <div
        style={{
          display: "flex",
          gap: 28,
          marginTop: 16,
          flex: 1,
          opacity: boardIn,
          border: "2px solid transparent",
          borderRadius: 16,
          padding: 8,
          position: "relative",
        }}
      >
        {/* 截图强调层：边框显色 + 光晕，随台词渐入渐出，零几何变化 */}
        <div
          style={{
            position: "absolute",
            inset: -2,
            border: `2px solid ${theme.primaryBright}`,
            borderRadius: 16,
            boxShadow: `0 0 34px rgba(124, 182, 255, ${0.10 + shotTip * 0.22})`,
            opacity: fade(0.755, 12),
            pointerEvents: "none",
          }}
        />
        {/* 左面板：正常顺序 */}
        <TimelinePanel
          title="正常顺序"
          titleColor={theme.ok}
          steps={STEPS.map((s) => ({ ...s, p: 0.36 + STEPS.indexOf(s) * 0.02 }))}
          t2={{ p: 0.38, text: "T2  看到 null → 等待", color: theme.textMuted }}
          fade={fade}
        />

        {/* 右面板：重排顺序（swap 交换 ②③；volatile 焊死回位） */}
        <div
          style={{
            flex: 1,
            backgroundColor: theme.codeBg,
            border: `1px solid ${welded ? theme.ok : theme.danger}`,
            borderRadius: 12,
            padding: "12px 20px",
            position: "relative",
            boxShadow: welded ? "none" : `0 0 ${28 * (boardIn > 0 ? 1 : 0)}px rgba(255,82,82,${0.12 + boom})`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: theme.danger }}>
              重排顺序（无 volatile 时可能发生）
            </span>
            {welded && (
              <span
                style={{
                  fontSize: 20,
                  color: theme.ok,
                  border: `1px solid ${theme.ok}`,
                  borderRadius: 999,
                  padding: "2px 12px",
                  opacity: fade(0.62),
                }}
              >
                🔒 volatile 焊死：禁止重排
              </span>
            )}
          </div>
          {[
            { ...STEPS[0], p: 0.36, early: false },
            { ...STEPS[2], p: 0.38, early: true },
            { ...STEPS[1], p: 0.4, early: false },
          ].map((s, i) => {
            // 交换动画：块 2（③）与块 3（②）在 swap 度下互换纵位（块高 40 + 缝 8）
            const dy = i === 1 ? swap * 48 : i === 2 ? -swap * 48 : 0;
            return (
              <div
                key={s.n}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  height: 40,
                  marginBottom: 8,
                  transform: `translateY(${dy}px)`,
                  opacity: fade(s.p),
                }}
              >
                <span style={{ fontFamily: theme.font.mono, fontSize: 22, color: theme.textMuted, width: 30 }}>{s.n}</span>
                <span
                  style={{
                    fontSize: 21,
                    color: s.early ? theme.warn : theme.text,
                    border: `1px solid ${s.early ? theme.warn : theme.surfaceBorder}`,
                    borderRadius: 8,
                    padding: "5px 14px",
                    backgroundColor: "rgba(10, 24, 38, 0.8)",
                  }}
                >
                  {s.t}
                </span>
                {s.early && <span style={{ fontSize: 20, fontWeight: 700, color: theme.warn }}>← 提前！</span>}
              </div>
            );
          })}
          <div
            style={{
              fontSize: 21,
              fontFamily: theme.font.mono,
              color: theme.danger,
              opacity: fade(0.5),
              marginTop: 4,
            }}
          >
            T2 看到"非空" → 直接拿走 → 半成品对象 → <span style={{ fontWeight: 700 }}>NPE 💥</span>
          </div>
        </div>
      </div>

      {/* 截图提示不再单设浮条：与台词字幕重复；由时间轴外框高亮（shotTip 边框）承担「截图页」标记 */}
    </AbsoluteFill>
  );
};

/** A2 左面板：正常顺序三步 + T2 行（内部小组件，仅本镜使用） */
const TimelinePanel: FC<{
  title: string;
  titleColor: string;
  steps: { n: string; t: string; p: number }[];
  t2: { p: number; text: string; color: string };
  fade: (p: number, dur?: number) => number;
}> = ({ title, titleColor, steps, t2, fade }) => (
  <div
    style={{
      flex: 1,
      backgroundColor: theme.codeBg,
      border: `1px solid ${theme.surfaceBorder}`,
      borderRadius: 12,
      padding: "12px 20px",
    }}
  >
    <div style={{ fontSize: 22, fontWeight: 700, color: titleColor, marginBottom: 8 }}>{title}</div>
    {steps.map((s) => (
      <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 12, height: 40, marginBottom: 8, opacity: fade(s.p) }}>
        <span style={{ fontFamily: theme.font.mono, fontSize: 22, color: theme.textMuted, width: 30 }}>{s.n}</span>
        <span
          style={{
            fontSize: 21,
            color: theme.text,
            border: `1px solid ${theme.surfaceBorder}`,
            borderRadius: 8,
            padding: "5px 14px",
            backgroundColor: "rgba(10, 24, 38, 0.8)",
          }}
        >
          {s.t}
        </span>
      </div>
    ))}
    <div style={{ fontSize: 21, fontFamily: theme.font.mono, color: t2.color, marginTop: 4, opacity: fade(t2.p) }}>
      {t2.text}
    </div>
  </div>
);
