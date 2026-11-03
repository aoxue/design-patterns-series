import type { FC } from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";
import { useAnchors, type SceneProps } from "../scene-kit";

/**
 * 镜 3.2 · 五版对比卡 + 决策树（6:44–7:30）
 * 五卡随口播逐张点亮（锚 = 各句 chunk 起点：0.115/0.231/0.350/0.530/0.658）
 * 卡内含模式伪代码；决策树随末四句逐段生长（0.799 起）。
 * 锚点经 AnchorCtx 穿透 align.json 实测时间轴。
 */
const CARDS = [
  {
    v: "V1", n: "饿汉式", p: 0.115, star: 3,
    d: "一行到位，简单可靠；缺点是急，类加载即创建",
    code: "static final M I =\n    new M();",
  },
  {
    v: "V2", n: "懒汉式", p: 0.231, star: 1,
    d: "第一次用才建；裸奔多线程，一翻车就是两个实例",
    code: "if (I == null)\n    I = new M();",
  },
  {
    v: "V3", n: "双检锁", p: 0.350, star: 3,
    d: "一查加锁二查创建，性能安全双全；代价是必须懂 volatile",
    code: "volatile M I;\nif (I==null) synchronized\n    { if (I==null) I=new M(); }",
  },
  {
    v: "V4", n: "静态内部类", p: 0.530, star: 5,
    d: "借 JVM 类加载机制，懒和安全白送，手写首选",
    code: "class Holder {\n    static final M I\n        = new M(); }",
  },
  {
    v: "V5", n: "枚举", p: 0.658, star: 5,
    d: "再加防反射、防序列化，Effective Java 的答案",
    code: "enum M {\n    INSTANCE;\n}",
  },
];

/** 决策树锚点（chunk 起点字位） */
const T = { root: 0.799, no: 0.868, yes: 0.906, ask: 0.949, top: 0.96 };

export const Scene32Compare: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { fade, pop, seen } = useAnchors(leadFrames, audioFrames);

  /** 决策树连线：path + 起始锚 + 分支标签（位置为标签圆片中心） */
  const SEGS = [
    { d: "M 205 138 H 470 V 46 H 1235", a: T.no, label: "不要", lx: 800, ly: 26 },
    { d: "M 205 146 H 1235", a: T.yes, label: "要", lx: 440, ly: 126 },
    { d: "M 780 146 V 246 H 1235", a: T.top, label: "要", lx: 1000, ly: 228, arrowEnd: true },
  ];

  return (
    <AbsoluteFill style={{ padding: "104px 90px 132px" }}>
      <div style={{ fontSize: 36, fontWeight: 700, color: theme.text, marginBottom: 20 }}>
        五版对比卡 · 本期知识地图 <span style={{ fontSize: 24, color: theme.warn, fontWeight: 400 }}>📸 建议截图</span>
      </div>

      {/* 五卡横排：随口播逐张点亮，卡内含伪代码 */}
      <div style={{ display: "flex", gap: 20 }}>
        {CARDS.map((c) => {
          const on = seen(c.p);
          const isHot = on && c.star >= 5;
          return (
            <div
              key={c.v}
              style={{
                flex: 1,
                backgroundColor: theme.surface,
                border: `2px solid ${isHot ? theme.primary : theme.surfaceBorder}`,
                borderRadius: 14,
                padding: "16px 16px 12px",
                opacity: on ? 1 : 0.22,
                transform: `translateY(${on ? 0 : 20}px)`,
                boxShadow: isHot ? `0 0 26px rgba(59, 130, 246, 0.16)` : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: theme.font.mono, fontSize: 24, color: theme.primaryBright }}>{c.v}</span>
                <span style={{ fontSize: 25, fontWeight: 700, color: theme.text }}>{c.n}</span>
                <span style={{ marginLeft: "auto", fontSize: 18, color: theme.warn, letterSpacing: 1 }}>
                  {"★".repeat(c.star)}
                  <span style={{ color: theme.surfaceBorder }}>{"★".repeat(5 - c.star)}</span>
                </span>
              </div>
              <div style={{ fontSize: 18, color: theme.textMuted, lineHeight: 1.55, minHeight: 86 }}>{c.d}</div>
              <div
                style={{
                  marginTop: 10,
                  backgroundColor: theme.deepBg,
                  border: `1px solid ${theme.surfaceBorder}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  fontFamily: theme.font.mono,
                  fontSize: 16,
                  lineHeight: 1.5,
                  color: theme.codePlain,
                  whiteSpace: "pre",
                }}
              >
                {c.code}
              </div>
            </div>
          );
        })}
      </div>

      {/* 决策树：三问三答，随末四句逐段生长 */}
      <div
        style={{
          flex: 1,
          marginTop: 22,
          backgroundColor: "rgba(10, 24, 38, 0.6)",
          border: `1px solid ${theme.surfaceBorder}`,
          borderRadius: 16,
          padding: "18px 36px 10px",
          opacity: fade(0.77),
          position: "relative",
        }}
      >
        <div style={{ fontSize: 22, color: theme.textMuted }}>三秒决策树 · 一个问题帮你记住五个</div>

        <div style={{ position: "relative", height: 272, marginTop: 6 }}>
          <svg viewBox="0 0 1720 272" width="100%" height="272" style={{ position: "absolute", inset: 0 }}>
            {SEGS.map((seg) => {
              const t = fade(seg.a, 10);
              if (t <= 0) return null;
              return (
                <g key={seg.d}>
                  <path
                    d={seg.d}
                    fill="none"
                    stroke={theme.primaryBright}
                    strokeWidth={3.5}
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - t}
                    opacity={0.9}
                  />
                  {t > 0.95 && (
                    <polygon points="1235,140 1222,133 1222,147" fill={theme.primaryBright} transform={seg.ly > 150 ? `translate(0 ${seg.ly - 140})` : seg.ly < 100 ? `translate(0 ${seg.ly - 140})` : ""} />
                  )}
                </g>
              );
            })}
          </svg>

          {/* 分支标签圆片：随线浮现 */}
          {SEGS.filter((s) => s.label).map((s) => (
            <span
              key={s.label + s.lx}
              style={{
                position: "absolute",
                left: s.lx - 30,
                top: s.ly - 17,
                width: 60,
                height: 34,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: 19,
                color: theme.text,
                border: `2px solid ${theme.surfaceBorder}`,
                borderRadius: 999,
                backgroundColor: theme.bg,
                opacity: fade(s.a + 0.004, 8),
              }}
            >
              {s.label}
            </span>
          ))}

          {/* 根问题 */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 104,
              fontSize: 25,
              fontWeight: 700,
              color: theme.text,
              border: `3px solid ${theme.primaryBright}`,
              borderRadius: 14,
              padding: "14px 22px",
              backgroundColor: "rgba(59, 130, 246, 0.12)",
              opacity: pop(T.root),
              transform: `scale(${0.85 + pop(T.root) * 0.15})`,
            }}
          >
            要不要懒？
          </div>

          {/* 追问（后插到「要」分支上） */}
          <div
            style={{
              position: "absolute",
              left: 620,
              top: 108,
              fontSize: 24,
              fontWeight: 700,
              color: theme.text,
              border: `3px solid ${theme.warn}`,
              borderRadius: 14,
              padding: "13px 20px",
              backgroundColor: "rgba(255, 184, 77, 0.10)",
              opacity: pop(T.ask),
              transform: `scale(${0.85 + pop(T.ask) * 0.15})`,
            }}
          >
            还要防反射？
          </div>

          {/* 叶子结论 */}
          {[
            { v: "V1", r: "饿汉式 · 收工", x: 1235, y: 18, a: T.no + 0.006, hot: false },
            { v: "V4", r: "静态内部类 · 起步", x: 1235, y: 108, a: T.yes + 0.006, hot: false },
            { v: "V5", r: "枚举 · 封顶", x: 1235, y: 198, a: T.top + 0.006, hot: true },
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
                fontSize: 24,
                color: theme.text,
                border: `2.5px solid ${leaf.hot ? theme.ok : theme.surfaceBorder}`,
                borderRadius: 12,
                padding: "10px 18px",
                backgroundColor: leaf.hot ? "rgba(63, 218, 140, 0.10)" : theme.surface,
                opacity: pop(leaf.a),
                transform: `translateX(${(1 - pop(leaf.a)) * 22}px)`,
                boxShadow: leaf.hot && seen(leaf.a + 0.008) ? `0 0 26px rgba(63, 218, 140, 0.28)` : "none",
              }}
            >
              <span style={{ fontFamily: theme.font.mono, color: leaf.hot ? theme.ok : theme.primaryBright, fontSize: 22 }}>
                {leaf.v}
              </span>
              {leaf.r}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
