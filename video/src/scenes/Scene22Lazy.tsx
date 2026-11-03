import type { FC } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { CodeCard, type CodeLine } from "../components/CodeCard";
import { theme } from "../theme";
import { useAnchors, type SceneProps } from "../scene-kit";

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
      { text: ";                         // 先不创建", kind: "comment" },
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
      { text: "+        if (instance == null) {                 // ① 判空", kind: "plain" },
    ],
  },
  {
    diff: "add",
    segs: [
      { text: "+            instance = " },
      { text: "new PromoConfigManager()", kind: "danger" },
      { text: "();      // ② 创建：①②之间没有锁" },
    ],
  },
  { diff: "add", segs: [{ text: "+        }" }] },
  { diff: "add", segs: [{ text: "+        return instance;" }] },
  { diff: "add", segs: [{ text: "+    }" }] },
  { segs: [{ text: " }" }] },
];

// diff 各行出现的台词进度（对应「先留空 → 判空/创建/返回」讲解顺序）
const VIS = [0.04, 0.055, 0.075, 0.085, 0.1, 0.12, 0.14, 0.15, 0.155, 0.16, 0.165, 0.17];

/** A1 时序板行：[台词进度, 线程列(0=A 1=B), 文本, 是否翻车步] */
const RACE: { p: number; col: 0 | 1; text: string; note?: string; bad?: boolean }[] = [
  { p: 0.21, col: 0, text: "判空 → null ✓" },
  { p: 0.25, col: 1, text: "判空 → null ✓", note: "两人都通过了检查" },
  { p: 0.31, col: 0, text: "new 实例①", bad: true },
  { p: 0.35, col: 1, text: "new 实例②", bad: true },
];

export const Scene22Lazy: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, at, fade, pop, seen } = useAnchors(leadFrames, audioFrames);

  const revealAt = VIS.map(at);
  const boardIn = fade(0.19);
  const broken = pop(0.4); // 「单例？只剩个名字」破裂标签
  // 破裂抖动：标签出现后 12 帧内横向震颤
  const shake = seen(0.4) ? Math.max(0, 1 - (frame - at(0.4)) / 12) * Math.sin((frame - at(0.4)) / 1.4) * 8 : 0;
  const syncIn = fade(0.46);
  const lockBarW = interpolate(frame, [at(0.56), at(0.66)], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const knotIn = fade(0.74);
  const v3In = pop(0.84);

  return (
    <AbsoluteFill style={{ padding: "130px 90px 150px" }}>
      <div style={{ fontSize: 38, fontWeight: 700, color: theme.text, marginBottom: 24 }}>
        <span style={{ fontFamily: theme.font.mono, color: theme.primaryBright }}>V2</span> 懒汉式 ·
        第一次用到再建 <span style={{ fontSize: 26, color: theme.textMuted, fontWeight: 400 }}>，但多线程在等你翻车</span>
      </div>

      <div style={{ display: "flex", gap: 40, flex: 1 }}>
        {/* 左：C3 diff 卡 */}
        <div style={{ flex: 1.5 }}>
          <CodeCard title="PromoConfigManager.java · V1 → V2（diff）" lines={LINES} revealAt={revealAt} fontSize={19} />
        </div>

        {/* 右：A1 时序板 + synchronized 警告 + 死结 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              backgroundColor: theme.codeBg,
              border: `1px solid ${broken > 0.5 ? theme.danger : theme.surfaceBorder}`,
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
              <span style={{ width: "50%", color: theme.primaryBright }}>线程 A</span>
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
                        opacity: fade(r.p),
                        transform: `translateX(${(1 - fade(r.p)) * 18}px)`,
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
              backgroundColor: theme.surface,
              border: `1px solid ${theme.surfaceBorder}`,
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
                  backgroundColor: "rgba(10, 24, 38, 0.9)",
                  border: `1px solid ${theme.surfaceBorder}`,
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
              backgroundColor: "rgba(59, 130, 246, 0.10)",
              border: `1px solid ${theme.primary}`,
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
                  color: theme.primaryBright,
                  border: `1px solid ${theme.primary}`,
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
                color: theme.primaryBright,
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
