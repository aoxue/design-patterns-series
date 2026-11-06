import type { FC } from "react";
import { AbsoluteFill, Freeze, interpolate } from "remotion";
import { CodeCard, type CodeLine } from "../../components/CodeCard";
import { alpha, theme } from "../../theme";
import { useAnchors, type SceneProps, usePalette } from "../../scene-kit";
import { Scene23bReorder } from "./Scene23bReorder";

/**
 * 镜 2.4 · V4 静态内部类（4:23–5:19）
 * v4.1 视觉承接：镜首 0–6.3s（台词「双检锁解决了…」至「有没有一种写法」前）
 * 冻结 2.3b 末帧（A2 时间轴定格态）再渐出，6.3s 起 C5 场景渐入：
 * 音频段边界不动，用视觉连续性实现导演要的「晚点切」。
 * C5 显形 → Holder 类挂 JVM 两块牌子（用时才加载 / 初始化自带锁）
 * → 懒和安全白送徽章 → DCL 10 行 vs 内部类 6 行对比 → 手写首选。
 * v4.1 锚点实测化：全部节拍改挂 align.json 词位（第四版 12.5 / 静态内部类 13.6 /
 * getInstance 17.2 / Holder.INSTANCE 20.7 / 用到才加载 28.5 / 天然加锁 33.9 / 白送 39.5）。
 */
const LINES: CodeLine[] = [
  { segs: [{ text: "public class PromoConfigManager {" }] },
  { segs: [{ text: "    private PromoConfigManager() { refresh(); }" }] },
  {
    segs: [
      { text: "    private static class " },
      { text: "Holder", kind: "kw" },
      { text: " { // 首次访问才加载", kind: "comment" },
    ],
  },
  {
    segs: [
      { text: "        static final PromoConfigManager " },
      { text: "INSTANCE", kind: "kw" },
      { text: " = " },
      { text: "new PromoConfigManager()", kind: "danger" },
      { text: ";" },
    ],
  },
  { segs: [{ text: "    }" }] },
  {
    segs: [
      { text: "    public static PromoConfigManager " },
      { text: "getInstance", kind: "kw" },
      { text: "() { return Holder.INSTANCE; }" },
    ],
  },
  { segs: [{ text: "}" }] },
];

export const Scene24Holder: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, atWord, fadeAt, popAt } = useAnchors(leadFrames, audioFrames);
  const palette = usePalette();

  // ---- 承接层：2.3b 末帧冻结（Freeze 超出末帧后所有 clamp 动画饱和在定格态）----
  const askF = atWord("有没有一种写法", 0.105); // ≈6.3s，导演要求的切换点
  const clampOpt = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
  const handoffOut = interpolate(frame, [askF - 6, askF + 10], [1, 0], clampOpt);
  const contentIn = interpolate(frame, [askF, askF + 12], [0, 1], clampOpt);

  // ---- C5 与右侧节拍（实测词位）----
  const v4F = atWord("第四版", 0.2);
  const holderF = atWord("静态内部类", 0.22);
  const getterF = atWord("getInstance", 0.29);
  const instanceF = atWord("直接返回", 0.35);
  const revealAt = [
    v4F,
    v4F + 6,
    holderF,
    instanceF,
    instanceF + 8,
    getterF,
    getterF + 14,
  ];
  const promiseF = atWord("这个内部类", 0.4); // JVM 两份承诺卡 ≈24.9s
  const loadOnF = atWord("才加载", 0.5); // 牌一 用时才加载 ≈28.5s
  const lockOnF = atWord("天然加锁", 0.56); // 牌二 初始化自带锁 ≈33.9s
  const freeF = atWord("一行并发", 0.62); // 白送徽章 ≈37.5s
  const cmpF = atWord("都省", 0.68); // 行数对比 ≈40.7s
  const smartF = atWord("不是我们聪明", 0.72); // 收尾卡 ≈41.9s

  return (
    <>
      {/* 2.3b 末帧定格（音频段边界不动，视觉延续再渐出） */}
      {handoffOut > 0.001 && (
        <AbsoluteFill style={{ opacity: handoffOut }}>
          {/* 冻结帧号取超大值：所有动画均 clamp 饱和，即该镜末帧定格态 */}
          <Freeze frame={99999}>
            <Scene23bReorder frames={1371} leadFrames={12} audioFrames={1335} />
          </Freeze>
        </AbsoluteFill>
      )}

      <AbsoluteFill style={{ padding: "130px 90px 150px", opacity: contentIn }}>
        <div style={{ fontSize: 38, fontWeight: 700, color: theme.text, marginBottom: 24 }}>
          <span style={{ fontFamily: theme.font.mono, color: palette.primaryBright }}>V4</span> 静态内部类 ·
          手写首选 <span style={{ fontSize: 26, color: theme.textMuted, fontWeight: 400 }}>· JVM 早就把路修好了</span>
        </div>

        <div style={{ display: "flex", gap: 40, flex: 1 }}>
          {/* 左：C5 代码卡 */}
          <div style={{ flex: 1.4 }}>
            <CodeCard title="PromoConfigManager.java · V4 静态内部类" lines={LINES} revealAt={revealAt} fontSize={22} />
          </div>

          {/* 右：JVM 牌子 + 白送徽章 + 行数对比 */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
            <div
              style={{
                backgroundColor: palette.surface,
                border: `1px solid ${palette.surfaceBorder}`,
                borderRadius: 14,
                padding: "22px 26px",
                opacity: fadeAt(promiseF),
              }}
            >
              <div style={{ fontSize: 24, color: theme.textMuted, marginBottom: 14 }}>
                JVM 对 <span style={{ fontFamily: theme.font.mono, color: palette.primaryBright }}>Holder</span> 的两份承诺
              </div>
              {[
                { t: "用时才加载", d: "第一次读到 Holder.INSTANCE 才触发类初始化 → 懒加载", f: loadOnF },
                { t: "初始化自带锁", d: "<clinit> 执行期间 JVM 加锁 → 线程安全", f: lockOnF },
              ].map((b) => (
                <div
                  key={b.t}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "10px 0",
                    opacity: fadeAt(b.f),
                  }}
                >
                  <span style={{ fontSize: 30 }}>🏷️</span>
                  <div>
                    <div style={{ fontSize: 25, fontWeight: 700, color: palette.primaryBright }}>{b.t}</div>
                    <div style={{ fontSize: 20, color: theme.textMuted }}>{b.d}</div>
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                gap: 12,
                opacity: fadeAt(freeF),
              }}
            >
              {["懒 ✓", "线程安全 ✓", "volatile 免了 ✓"].map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 23,
                    color: theme.ok,
                    border: `1px solid ${theme.ok}`,
                    borderRadius: 999,
                    padding: "6px 18px",
                    backgroundColor: "rgba(63, 218, 140, 0.08)",
                  }}
                >
                  {t}
                </span>
              ))}
            </div>

            {/* DCL vs 内部类 行数对比条 */}
            <div
              style={{
                backgroundColor: palette.surface,
                border: `1px solid ${palette.surfaceBorder}`,
                borderRadius: 14,
                padding: "20px 26px",
                opacity: fadeAt(cmpF),
              }}
            >
              <div style={{ fontSize: 23, color: theme.textMuted, marginBottom: 12 }}>代码量对比</div>
              {[
                { n: "V3 双检锁", w: 100, label: "10 行" },
                { n: "V4 内部类", w: 60, label: "6 行" },
              ].map((r, i) => (
                <div key={r.n} style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 0" }}>
                  <span style={{ fontSize: 22, color: theme.text, width: 130, whiteSpace: "nowrap" }}>{r.n}</span>
                  <div style={{ flex: 1, height: 22, borderRadius: 6, backgroundColor: alpha(palette.bg, 0.9) }}>
                    <div
                      style={{
                        width: `${r.w}%`,
                        height: "100%",
                        borderRadius: 6,
                        backgroundColor: i === 0 ? palette.surfaceBorder : theme.ok,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: 22, fontFamily: theme.font.mono, color: theme.textMuted, whiteSpace: "nowrap" }}>
                    {r.label}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                borderRadius: 14,
                padding: "16px 22px",
                backgroundColor: alpha(palette.primary, 0.10),
                border: `1px solid ${palette.primary}`,
                fontSize: 23,
                lineHeight: 1.6,
                color: theme.text,
                textAlign: "center",
                opacity: popAt(smartF),
              }}
            >
              不是我们聪明，是 <span style={{ color: palette.primaryBright }}>JVM 类加载机制</span>
              <br />
              替你把路修好了
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </>
  );
};
