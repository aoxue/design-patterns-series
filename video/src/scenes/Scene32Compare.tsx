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

      {/* 决策树：一个问题记住五个（分支按台词顺序逐段生长，锚点取自台词字位） */}
      <div
        style={{
          flex: 1,
          marginTop: 30,
          backgroundColor: "rgba(10, 24, 38, 0.6)",
          border: `1px solid ${theme.surfaceBorder}`,
          borderRadius: 16,
          padding: "22px 40px",
          opacity: fade(0.78),
          position: "relative",
        }}
      >
        <div style={{ fontSize: 24, color: theme.textMuted, marginBottom: 6 }}>
          三秒决策树 —— 一个问题帮你记住五个
        </div>

        {/* 台词锚点：根 0.80 / 不要→V1 0.86 / 要→V4 0.90 / 追问 0.95 / 枚举 0.97 */}
        <div style={{ position: "relative", height: 280 }}>
          <svg viewBox="0 0 1660 280" width="100%" height="280" style={{ position: "absolute", inset: 0 }}>
            {/* 连线逐段「生长」：strokeDashoffset 1→0 */}
            {[
              { d: "M 280 140 H 470 V 72 H 1175", a: 0.862 }, // 不要 → V1
              { d: "M 280 148 H 1175", a: 0.902 }, // 要 →（穿过追问位）→ V4
              { d: "M 1040 150 V 236 H 1175", a: 0.962 }, // 追问 → 要 → V5
            ].map((seg) => (
              <path
                key={seg.d}
                d={seg.d}
                fill="none"
                stroke={theme.primaryBright}
                strokeWidth={3}
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - fade(seg.a, 10)}
                opacity={0.85}
              />
            ))}
          </svg>

          {/* 分支标签 */}
          {[
            { t: "不要", x: 495, y: 58, a: 0.87 },
            { t: "要", x: 405, y: 122, a: 0.91 },
            { t: "不要", x: 1075, y: 128, a: 0.955 },
            { t: "要", x: 1062, y: 200, a: 0.968 },
          ].map((l) => (
            <span
              key={l.t + l.x}
              style={{
                position: "absolute",
                left: l.x,
                top: l.y,
                fontSize: 22,
                color: theme.textMuted,
                opacity: fade(l.a, 8),
              }}
            >
              {l.t}
            </span>
          ))}

          {/* 根问题 */}
          <div
            style={{
              position: "absolute",
              left: 20,
              top: 108,
              fontSize: 26,
              fontWeight: 700,
              color: theme.text,
              border: `2px solid ${theme.primaryBright}`,
              borderRadius: 12,
              padding: "12px 22px",
              backgroundColor: "rgba(59, 130, 246, 0.12)",
              opacity: pop(0.8),
              transform: `scale(${0.85 + pop(0.8) * 0.15})`,
            }}
          >
            要不要懒？
          </div>

          {/* 追问节点（后插到「要」分支上） */}
          <div
            style={{
              position: "absolute",
              left: 560,
              top: 112,
              fontSize: 24,
              fontWeight: 700,
              color: theme.text,
              border: `2px solid ${theme.warn}`,
              borderRadius: 12,
              padding: "11px 20px",
              backgroundColor: "rgba(255, 184, 77, 0.10)",
              opacity: pop(0.947),
              transform: `scale(${0.85 + pop(0.947) * 0.15})`,
            }}
          >
            还要防反射？
          </div>

          {/* 叶子结论 */}
          {[
            { v: "V1", n: "饿汉式", r: "收工", x: 1175, y: 38, a: 0.872, hot: false },
            { v: "V4", n: "静态内部类", r: "起步", x: 1175, y: 122, a: 0.913, hot: false },
            { v: "V5", n: "枚举", r: "封顶", x: 1175, y: 210, a: 0.972, hot: true },
          ].map((leaf) => (
            <div
              key={leaf.v}
              style={{
                position: "absolute",
                left: leaf.x,
                top: leaf.y,
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                fontSize: 25,
                color: theme.text,
                border: `2px solid ${leaf.hot ? theme.ok : theme.surfaceBorder}`,
                borderRadius: 12,
                padding: "10px 20px",
                backgroundColor: leaf.hot ? "rgba(63, 218, 140, 0.10)" : theme.surface,
                opacity: pop(leaf.a),
                transform: `translateX(${(1 - pop(leaf.a)) * 22}px)`,
                boxShadow: leaf.hot && seen(leaf.a + 0.005) ? `0 0 30px rgba(63, 218, 140, 0.30)` : "none",
              }}
            >
              <span style={{ fontFamily: theme.font.mono, color: leaf.hot ? theme.ok : theme.primaryBright, fontSize: 23 }}>
                {leaf.v}
              </span>
              {leaf.n}
              <span style={{ color: leaf.hot ? theme.ok : theme.text, fontWeight: 700 }}>· {leaf.r}</span>
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
