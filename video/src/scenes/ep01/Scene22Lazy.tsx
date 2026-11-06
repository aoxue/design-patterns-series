import type { FC } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { CodeCard, type CodeLine } from "../../components/CodeCard";
import { alpha, theme } from "../../theme";
import { useAnchors, type SceneProps, usePalette } from "../../scene-kit";

/**
 * 镜 2.2 · V2 懒汉式 + 动画板 A1（2:10–2:50）
 * C3 diff 删红增绿 → 两线程在 new 之前擦肩而过 → 单例破裂 → synchronized 粗暴修法 → 死结引出 V3
 */
const LINES: CodeLine[] = [
  { segs: [{ text: " public class PromoConfigManager {" }] },
  {
    diff: "del",
    segs: [
      { text: "-    private static final PromoConfigManager INSTANCE = new " },
      { text: "PromoConfigManager()", kind: "danger" },
      { text: "();" },
    ],
  },
  {
    diff: "add",
    segs: [
      { text: "+    private static PromoConfigManager " },
      { text: "instance", kind: "kw" },
      { text: "; // 先不创建", kind: "comment" },
    ],
  },
  { segs: [{ text: "     private PromoConfigManager() { refresh(); }" }] },
  {
    diff: "del",
    segs: [{ text: "-    public static PromoConfigManager getInstance() { return INSTANCE; }" }],
  },
  {
    diff: "add",
    segs: [
      { text: "+    public static PromoConfigManager " },
      { text: "getInstance", kind: "kw" },
      { text: "() {" },
    ],
  },
  {
    diff: "add",
    segs: [
      { text: "+        if (instance == null) { // ① 判空", kind: "plain" },
    ],
  },
  {
    diff: "add",
    segs: [
      { text: "+            instance = " },
      { text: "new PromoConfigManager()", kind: "danger" },
      { text: "(); // ② 创建：①②之间没有锁" },
    ],
  },
  { diff: "add", segs: [{ text: "+        }" }] },
  { diff: "add", segs: [{ text: "+        return instance;" }] },
  { diff: "add", segs: [{ text: "+    }" }] },
  { segs: [{ text: " }" }] },
];

export const Scene22Lazy: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, atWord, fadeAt, popAt, seenAt } = useAnchors(leadFrames, audioFrames);
  const palette = usePalette();

  // ---- v4.1 实测锚点（align.json 词位）----
  // diff 显形：第二版 1.7 / 懒汉式 2.6 / 先留空 3.6 / 判空段 7.3（组内 8–60 帧级联收口）
  const v2F = atWord("第二版", 0.04);
  const lazyF = atWord("懒汉式", 0.055);
  const emptyF = atWord("先留空", 0.075);
  const checkF = atWord("判空、创建", 0.1);
  const revealAt = [
    v2F,
    lazyF,
    emptyF,
    emptyF + 20,
    checkF,
    checkF + 8,
    checkF + 18, // 判空①
    checkF + 30, // new②
    checkF + 36,
    checkF + 46, // return
    checkF + 52,
    checkF + 60,
  ];

  // A1 时序板：A 判空 15.0 / B 判空 18.5 / 擦肩而过 20.4 / 各自创建 21.6
  const boardIn = fadeAt(atWord("多线程的", 0.19), 14);
  const raceA1 = atWord("执行到判空", 0.21);
  const raceB1 = atWord("也判空", 0.25);
  const raceA2 = atWord("擦肩而过", 0.31);
  const raceB2 = atWord("各自创建", 0.35);
  const RACE: { f: number; col: 0 | 1; text: string; note?: string; bad?: boolean }[] = [
    { f: raceA1, col: 0, text: "判空 → null ✓" },
    { f: raceB1, col: 1, text: "判空 → null ✓", note: "两人都通过了检查" },
    { f: raceA2, col: 0, text: "new 实例①", bad: true },
    { f: raceB2, col: 1, text: "new 实例②", bad: true },
  ];

  const brokenF = atWord("只剩", 0.4); // 「单例？只剩个名字」破裂标签 ≈25.0s
  const broken = popAt(brokenF);
  // 破裂抖动：标签出现后 12 帧内横向震颤
  const shake = seenAt(brokenF)
    ? Math.max(0, 1 - (frame - brokenF) / 12) * Math.sin((frame - brokenF) / 1.4) * 8
    : 0;

  // ---- synchronized 粗暴修法（v4.1 D 项动效）----
  // 台词「方法上加 synchronized」≈31.3s：C3 的 getInstance 签名行瞬时插入关键字（diff 绿）
  // +「⚠ 每次抢锁」标签；念到「不值」≈41.5s 划掉，随后回落原状（死结段前还原）
  const syncF = atWord("最粗暴的修法", 0.46);
  const insertF = atWord("上加", 0.52);
  const lockHotF = atWord("热路径", 0.56);
  const notWorthF = atWord("不值", 0.9);
  const strikeF = notWorthF;
  const revertF = notWorthF + 14;
  const insertOn = seenAt(insertF) && !seenAt(revertF);
  const striking = seenAt(strikeF);
  const lines = LINES.map((l, i) =>
    i === 5 && insertOn
      ? {
          diff: "add" as const,
          segs: [
            { text: "+    public static " },
            { text: "synchronized", kind: "ok" as const, strike: striking },
            { text: " PromoConfigManager " },
            { text: "getInstance", kind: "kw" as const },
            { text: "() {" },
          ],
        }
      : l
  );

  const syncIn = fadeAt(syncF, 12);
  const lockBarW = interpolate(frame, [lockHotF, notWorthF], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const knotIn = fadeAt(atWord("死结", 0.74), 14);
  const v3In = popAt(atWord("第三版", 0.84));

  return (
    <AbsoluteFill style={{ padding: "130px 90px 150px" }}>
      <div style={{ fontSize: 38, fontWeight: 700, color: theme.text, marginBottom: 24 }}>
        <span style={{ fontFamily: theme.font.mono, color: palette.primaryBright }}>V2</span> 懒汉式 ·
        第一次用到再建 <span style={{ fontSize: 26, color: theme.textMuted, fontWeight: 400 }}>，但多线程在等你翻车</span>
      </div>

      <div style={{ display: "flex", gap: 40, flex: 1 }}>
        {/* 左：C3 diff 卡 */}
        <div style={{ flex: 1.5 }}>
          <CodeCard
            title="PromoConfigManager.java · V1 → V2（diff）"
            lines={lines}
            revealAt={revealAt}
            fontSize={19}
            notes={
              insertOn
                ? [{ line: 5, text: "⚠ 每次抢锁", opacity: fadeAt(insertF, 8), strike: striking }]
                : undefined
            }
          />
        </div>

        {/* 右：A1 时序板 + synchronized 警告 + 死结 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              backgroundColor: theme.codeBg,
              border: `1px solid ${broken > 0.5 ? theme.danger : palette.surfaceBorder}`,
              borderRadius: 14,
              padding: "18px 24px",
              opacity: boardIn,
              fontFamily: theme.font.mono,
            }}
          >
            <div style={{ fontSize: 22, color: theme.textMuted, marginBottom: 12 }}>
              动画板 A1 · 两线程时序
            </div>
            <div style={{ display: "flex", gap: 24, marginBottom: 10, fontSize: 24 }}>
              <span style={{ width: "50%", color: palette.primaryBright }}>线程 A</span>
              <span style={{ width: "50%", color: theme.warn }}>线程 B</span>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              {[0, 1].map((col) => (
                <div key={col} style={{ width: "50%" }}>
                  {RACE.filter((r) => r.col === col).map((r, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 20,
                        lineHeight: 1.7,
                        whiteSpace: "nowrap",
                        color: r.bad ? theme.danger : theme.text,
                        opacity: fadeAt(r.f),
                        transform: `translateX(${(1 - fadeAt(r.f)) * 18}px)`,
                      }}
                    >
                      {r.bad ? "💥 " : ""}
                      {r.text}
                      {r.note && (
                        <div style={{ fontSize: 17, color: theme.textMuted }}>← {r.note}</div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div
              style={{
                marginTop: 10,
                fontSize: 22,
                fontWeight: 700,
                color: theme.danger,
                opacity: broken,
                transform: `translateX(${shake}px)`,
              }}
            >
              单例破裂，回到事故现场：两个「自己」
            </div>
          </div>

          {/* synchronized 粗暴修法 */}
          <div
            style={{
              backgroundColor: palette.surface,
              border: `1px solid ${palette.surfaceBorder}`,
              borderRadius: 14,
              padding: "16px 24px",
              opacity: syncIn,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
              <span style={{ fontFamily: theme.font.mono, fontSize: 23, color: theme.ok }}>
                synchronized getInstance()
              </span>
              <span style={{ fontSize: 22, color: theme.textMuted }}>一次放行一个线程</span>
            </div>
            {/* 热路径抢锁：每次调用都要过闸 */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10 }}>
              <span style={{ fontSize: 20, color: theme.textMuted }}>高频热路径</span>
              <div
                style={{
                  flex: 1,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: alpha(palette.bg, 0.9),
                  border: `1px solid ${palette.surfaceBorder}`,
                  overflow: "hidden",
                }}
              >
                <div style={{ height: "100%", width: `${lockBarW}%`, backgroundColor: theme.warn }} />
              </div>
              <span style={{ fontSize: 20, color: theme.warn }}>⚠ 每次调用都抢锁</span>
            </div>
          </div>

          {/* 死结三标签 + V3 */}
          <div
            style={{
              borderRadius: 14,
              padding: "16px 24px",
              backgroundColor: alpha(palette.primary, 0.10),
              border: `1px solid ${palette.primary}`,
              opacity: knotIn,
              display: "flex",
              alignItems: "center",
              gap: 14,
            }}
          >
            <span style={{ fontSize: 24, color: theme.text }}>死结：</span>
            {["既要懒", "又要快", "还要安全"].map((t) => (
              <span
                key={t}
                style={{
                  fontSize: 22,
                  color: palette.primaryBright,
                  border: `1px solid ${palette.primary}`,
                  borderRadius: 999,
                  padding: "4px 14px",
                }}
              >
                {t}
              </span>
            ))}
            <span
              style={{
                marginLeft: "auto",
                fontFamily: theme.font.mono,
                fontSize: 23,
                color: palette.primaryBright,
                opacity: v3In,
              }}
            >
              → V3 双检锁
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
