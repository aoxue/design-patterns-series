import type { FC } from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";
import { useAnchors, type SceneProps } from "../scene-kit";

/**
 * 镜 3.2 · 五版本对比卡 + 决策树（6:10–7:00）
 * 五格卡片依次翻出（版本名 + 优缺点 + 推荐星级）→ 底部「一个问题记住五个」决策树
 */
const CARDS = [
  { v: "V1", n: "饿汉式", d: "一行到位，简单可靠；缺点是急——类加载即创建", star: 3, p: 0.08 },
  { v: "V2", n: "懒汉式", d: "第一次用才建；裸奔多线程，一翻车就是两个实例", star: 1, p: 0.15 },
  { v: "V3", n: "双检锁", d: "一查加锁二查创建，性能安全双全；代价是必须懂 volatile", star: 3, p: 0.23 },
  { v: "V4", n: "静态内部类", d: "借 JVM 类加载机制，懒和安全白送——手写首选", star: 5, p: 0.32 },
  { v: "V5", n: "枚举", d: "再加防反射、防序列化——Effective Java 的答案", star: 5, p: 0.4 },
];

export const Scene32Compare: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { fade, pop, seen } = useAnchors(leadFrames, audioFrames);

  return (
    <AbsoluteFill style={{ padding: "110px 90px 140px" }}>
      <div style={{ fontSize: 36, fontWeight: 700, color: theme.text, marginBottom: 26 }}>
        五版对比卡 · 本期知识地图 <span style={{ fontSize: 24, color: theme.warn, fontWeight: 400 }}>📸 建议截图</span>
      </div>

      {/* 五格横排 */}
      <div style={{ display: "flex", gap: 22 }}>
        {CARDS.map((c) => (
          <div
            key={c.v}
            style={{
              flex: 1,
              backgroundColor: theme.surface,
              border: `1px solid ${c.star >= 5 ? theme.primary : theme.surfaceBorder}`,
              borderRadius: 14,
              padding: "20px 20px 16px",
              opacity: fade(c.p - 0.01),
              transform: `translateY(${(1 - fade(c.p - 0.01)) * 26}px)`,
              boxShadow: c.star >= 5 ? `0 0 30px rgba(59, 130, 246, 0.18)` : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
              <span style={{ fontFamily: theme.font.mono, fontSize: 26, color: theme.primaryBright }}>{c.v}</span>
              <span style={{ fontSize: 27, fontWeight: 700, color: theme.text }}>{c.n}</span>
            </div>
            <div style={{ fontSize: 20, color: theme.textMuted, lineHeight: 1.65, minHeight: 130 }}>{c.d}</div>
            <div style={{ marginTop: 10, fontSize: 21, color: theme.warn, letterSpacing: 2 }}>
              {"★".repeat(c.star)}
              <span style={{ color: theme.surfaceBorder }}>{"★".repeat(5 - c.star)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 决策树：一个问题记住五个 */}
      <div
        style={{
          flex: 1,
          marginTop: 30,
          backgroundColor: "rgba(10, 24, 38, 0.6)",
          border: `1px solid ${theme.surfaceBorder}`,
          borderRadius: 16,
          padding: "24px 40px",
          opacity: fade(0.5),
          position: "relative",
        }}
      >
        <div style={{ fontSize: 24, color: theme.textMuted, marginBottom: 18 }}>
          三秒决策树 —— 一个问题帮你记住五个
        </div>

        {/* 根节点 */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 60 }}>
          <div
            style={{
              fontSize: 27,
              fontWeight: 700,
              color: theme.text,
              border: `2px solid ${theme.primaryBright}`,
              borderRadius: 12,
              padding: "14px 24px",
              backgroundColor: "rgba(59, 130, 246, 0.12)",
            }}
          >
            要不要懒？
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                opacity: fade(0.56),
              }}
            >
              <span style={{ fontSize: 23, color: theme.textMuted }}>不要 →</span>
              <span style={{ fontSize: 25, color: theme.text }}>
                <span style={{ fontFamily: theme.font.mono, color: theme.primaryBright }}>V1 饿汉</span> 收工
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: fade(0.62) }}>
              <span style={{ fontSize: 23, color: theme.textMuted }}>要 →</span>
              <span style={{ fontSize: 25, color: theme.text }}>
                <span style={{ fontFamily: theme.font.mono, color: theme.primaryBright }}>V4 内部类</span> 起步
              </span>
              <span
                style={{
                  fontSize: 23,
                  color: theme.textMuted,
                  opacity: seen(0.68) ? 1 : 0.25,
                }}
              >
                ── 还要防反射/序列化？→
              </span>
              <span
                style={{
                  fontSize: 25,
                  color: theme.text,
                  opacity: fade(0.72),
                }}
              >
                <span style={{ fontFamily: theme.font.mono, color: theme.primaryBright }}>V5 枚举</span> 封顶
              </span>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
