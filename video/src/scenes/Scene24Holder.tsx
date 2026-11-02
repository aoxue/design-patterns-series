import type { FC } from "react";
import { AbsoluteFill } from "remotion";
import { CodeCard, type CodeLine } from "../components/CodeCard";
import { theme } from "../theme";
import { useAnchors, type SceneProps } from "../scene-kit";

/**
 * 镜 2.4 · V4 静态内部类（3:50–4:20）
 * C5 显形 → Holder 类挂 JVM 两块牌子（用时才加载 / 初始化自带锁）
 * → 懒和安全白送徽章 → DCL 10 行 vs 内部类 6 行对比 → 手写首选
 */
const LINES: CodeLine[] = [
  { segs: [{ text: "public class PromoConfigManager {" }] },
  { segs: [{ text: "    private PromoConfigManager() { refresh(); }" }] },
  {
    segs: [
      { text: "    private static class " },
      { text: "Holder", kind: "kw" },
      { text: " {                       // 首次访问才加载", kind: "comment" },
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

const VIS = [0.05, 0.06, 0.13, 0.15, 0.16, 0.09, 0.1];

export const Scene24Holder: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { fade, pop, seen } = useAnchors(leadFrames, audioFrames);

  return (
    <AbsoluteFill style={{ padding: "130px 90px 150px" }}>
      <div style={{ fontSize: 38, fontWeight: 700, color: theme.text, marginBottom: 24 }}>
        <span style={{ fontFamily: theme.font.mono, color: theme.primaryBright }}>V4</span> 静态内部类 ·
        手写首选 <span style={{ fontSize: 26, color: theme.textMuted, fontWeight: 400 }}>—— JVM 早就把路修好了</span>
      </div>

      <div style={{ display: "flex", gap: 40, flex: 1 }}>
        {/* 左：C5 代码卡 */}
        <div style={{ flex: 1.4 }}>
          <CodeCard title="PromoConfigManager.java · V4 静态内部类" lines={LINES} visible={VIS.map(seen)} fontSize={22} />
        </div>

        {/* 右：JVM 牌子 + 白送徽章 + 行数对比 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              backgroundColor: theme.surface,
              border: `1px solid ${theme.surfaceBorder}`,
              borderRadius: 14,
              padding: "22px 26px",
              opacity: fade(0.15),
            }}
          >
            <div style={{ fontSize: 24, color: theme.textMuted, marginBottom: 14 }}>
              JVM 对 <span style={{ fontFamily: theme.font.mono, color: theme.primaryBright }}>Holder</span> 的两份承诺
            </div>
            {[
              { t: "用时才加载", d: "第一次读到 Holder.INSTANCE 才触发类初始化 → 懒加载", p: 0.17 },
              { t: "初始化自带锁", d: "<clinit> 执行期间 JVM 加锁 → 线程安全", p: 0.2 },
            ].map((b) => (
              <div
                key={b.t}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "10px 0",
                  opacity: fade(b.p),
                }}
              >
                <span style={{ fontSize: 30 }}>🏷️</span>
                <div>
                  <div style={{ fontSize: 25, fontWeight: 700, color: theme.primaryBright }}>{b.t}</div>
                  <div style={{ fontSize: 20, color: theme.textMuted }}>{b.d}</div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              gap: 12,
              opacity: fade(0.26),
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
              backgroundColor: theme.surface,
              border: `1px solid ${theme.surfaceBorder}`,
              borderRadius: 14,
              padding: "20px 26px",
              opacity: fade(0.3),
            }}
          >
            <div style={{ fontSize: 23, color: theme.textMuted, marginBottom: 12 }}>代码量对比</div>
            {[
              { n: "V3 双检锁", w: 100, label: "10 行" },
              { n: "V4 内部类", w: 60, label: "6 行" },
            ].map((r, i) => (
              <div key={r.n} style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 0" }}>
                <span style={{ fontSize: 22, color: theme.text, width: 130, whiteSpace: "nowrap" }}>{r.n}</span>
                <div style={{ flex: 1, height: 22, borderRadius: 6, backgroundColor: "rgba(10, 24, 38, 0.9)" }}>
                  <div
                    style={{
                      width: `${r.w}%`,
                      height: "100%",
                      borderRadius: 6,
                      backgroundColor: i === 0 ? theme.surfaceBorder : theme.ok,
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
              backgroundColor: "rgba(59, 130, 246, 0.10)",
              border: `1px solid ${theme.primary}`,
              fontSize: 23,
              lineHeight: 1.6,
              color: theme.text,
              textAlign: "center",
              opacity: pop(0.34),
            }}
          >
            不是我们聪明，是 <span style={{ color: theme.primaryBright }}>JVM 类加载机制</span>
            <br />
            替你把路修好了
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
