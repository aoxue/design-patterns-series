import type { FC } from "react";
import { AbsoluteFill } from "remotion";
import { alpha, theme } from "../../theme";
import { useAnchors, type SceneProps, usePalette } from "../../scene-kit";

/**
 * 镜 3.2 · 五版对比卡 + 决策树（7:10–8:02）
 * 五卡随口播逐张点亮（v4.1 实测词位：饿汉式 4.7 / 懒汉式 9.8 / 双检锁 15.7 /
 * 静态内部类 23.2 / 枚举 33.1s）；卡内含模式伪代码。
 * v4.1 决策树重排（F 项）：「还要防反射」改为组件卡之间的连线节点（不再是贴卡标签），
 * 连线终点接卡片左缘、实心箭头按线段方向绘制；svg 坐标系与 HTML 卡片同宽
 * （viewBox=容器实际宽 1666，修原 viewBox 1720 被 ~0.97 缩放导致的箭头错位 ~38px）。
 */
const CARDS = [
  {
    v: "V1", n: "饿汉式", kw: "饿汉式", fb: 0.115, star: 3,
    d: "一行到位，简单可靠；缺点是急，类加载即创建",
    code: "static final M I =\n    new M();",
  },
  {
    v: "V2", n: "懒汉式", kw: "懒汉式", fb: 0.231, star: 1,
    d: "第一次用才建；裸奔多线程，一翻车就是两个实例",
    code: "if (I == null)\n    I = new M();",
  },
  {
    v: "V3", n: "双检锁", kw: "双检锁", fb: 0.35, star: 3,
    d: "一查加锁二查创建，性能安全双全；代价是必须懂 volatile",
    code: "volatile M I;\nif (I==null) synchronized\n    { if (I==null) I=new M(); }",
  },
  {
    v: "V4", n: "静态内部类", kw: "静态内部类", fb: 0.53, star: 5,
    d: "借 JVM 类加载机制，懒和安全白送，手写首选",
    code: "class Holder {\n    static final M I\n        = new M(); }",
  },
  {
    v: "V5", n: "枚举", kw: "枚举：", fb: 0.658, star: 5,
    d: "再加防反射、防序列化，Effective Java 的答案",
    code: "enum M {\n    INSTANCE;\n}",
  },
];

export const Scene32Compare: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { atWord, fadeAt, popAt, seenAt } = useAnchors(leadFrames, audioFrames);
  const palette = usePalette();

  // 决策树实测锚点：要不要懒 39.5 / 不要 42.2 / 要懒 44.2 / 还要防反射 46.8 / 枚举封顶 48.4
  const T = {
    root: atWord("要不要懒", 0.799),
    no: atWord("不要，", 0.868),
    yes: atWord("要懒，", 0.906),
    ask: atWord("还要防反射", 0.949),
    top: atWord("枚举封顶", 0.96),
  };

  /** 决策树连线：path 终点停在箭头底、箭头尖接卡片左缘（1240）；标签圆片骑在水平线段上 */
  const SEGS: Array<{ d: string; a: number; arrow: [number, number]; label?: string; lx?: number; ly?: number }> = [
    { d: "M 185 135 H 470 V 45 H 1226", a: T.no, arrow: [1240, 45], label: "不要", lx: 700, ly: 45 },
    { d: "M 185 135 H 1226", a: T.yes, arrow: [1240, 135], label: "要", lx: 420, ly: 135 },
    { d: "M 185 150 V 225 H 546", a: T.ask, arrow: [560, 225], label: "要", lx: 350, ly: 225 },
    { d: "M 778 225 H 1226", a: T.top, arrow: [1240, 225] },
  ];

  return (
    <AbsoluteFill style={{ padding: "104px 90px 132px" }}>
      <div style={{ fontSize: 36, fontWeight: 700, color: theme.text, marginBottom: 20 }}>
        五版对比卡 · 本期知识地图 <span style={{ fontSize: 24, color: theme.warn, fontWeight: 400 }}>📸 建议截图</span>
      </div>

      {/* 五卡横排：随口播逐张点亮，卡内含伪代码 */}
      <div style={{ display: "flex", gap: 20 }}>
        {CARDS.map((c) => {
          const f = atWord(c.kw, c.fb);
          const on = seenAt(f);
          const isHot = on && c.star >= 5;
          return (
            <div
              key={c.v}
              style={{
                flex: 1,
                backgroundColor: palette.surface,
                border: `2px solid ${isHot ? palette.primary : palette.surfaceBorder}`,
                borderRadius: 14,
                padding: "16px 16px 12px",
                opacity: on ? 1 : 0.22,
                transform: `translateY(${on ? 0 : 20}px)`,
                boxShadow: isHot ? `0 0 26px ${alpha(palette.primary, 0.16)}` : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: theme.font.mono, fontSize: 24, color: palette.primaryBright }}>{c.v}</span>
                <span style={{ fontSize: 25, fontWeight: 700, color: theme.text }}>{c.n}</span>
                <span style={{ marginLeft: "auto", fontSize: 18, color: theme.warn, letterSpacing: 1 }}>
                  {"★".repeat(c.star)}
                  <span style={{ color: palette.surfaceBorder }}>{"★".repeat(5 - c.star)}</span>
                </span>
              </div>
              <div style={{ fontSize: 18, color: theme.textMuted, lineHeight: 1.55, minHeight: 86 }}>{c.d}</div>
              <div
                style={{
                  marginTop: 10,
                  backgroundColor: theme.deepBg,
                  border: `1px solid ${palette.surfaceBorder}`,
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

      {/* 决策树：三问三答，随末四句逐段生长（连线接卡、箭头对齐） */}
      <div
        style={{
          flex: 1,
          marginTop: 22,
          backgroundColor: alpha(palette.bg, 0.6),
          border: `1px solid ${palette.surfaceBorder}`,
          borderRadius: 16,
          padding: "18px 36px 10px",
          opacity: fadeAt(atWord("一个问题", 0.77)),
          position: "relative",
        }}
      >
        <div style={{ fontSize: 22, color: theme.textMuted }}>三秒决策树 · 一个问题帮你记住五个</div>

        {/* 坐标系：容器内容宽 1666（1920 − 页边 180 − 面板边框/内边距 74），
            svg 以 preserveAspectRatio="none" 铺满容器，与 HTML 卡片 px 坐标一致（1:1） */}
        <div style={{ position: "relative", height: 272, marginTop: 6 }}>
          <svg
            viewBox="0 0 1666 272"
            preserveAspectRatio="none"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            {SEGS.map((seg) => {
              const t = fadeAt(seg.a, 10);
              if (t <= 0) return null;
              const [ax, ay] = seg.arrow;
              return (
                <g key={seg.d}>
                  <path
                    d={seg.d}
                    fill="none"
                    stroke={palette.primaryBright}
                    strokeWidth={3.5}
                    pathLength={1}
                    strokeDasharray={1}
                    strokeDashoffset={1 - t}
                    opacity={0.9}
                  />
                  {t > 0.95 && (
                    <polygon points={`${ax},${ay} ${ax - 14},${ay - 7} ${ax - 14},${ay + 7}`} fill={palette.primaryBright} />
                  )}
                </g>
              );
            })}
          </svg>

          {/* 分支标签圆片：骑在水平线段中段（底色盖线，视觉为「线上的标签」而非贴卡） */}
          {SEGS.map((s, i) => {
            if (s.label === undefined || s.lx === undefined || s.ly === undefined) return null;
            return (
              <span
                key={`${s.label}-${i}`}
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
                  border: `2px solid ${palette.surfaceBorder}`,
                  borderRadius: 999,
                  backgroundColor: palette.bg,
                  opacity: fadeAt(s.a + 4, 8),
                }}
              >
                {s.label}
              </span>
            );
          })}

          {/* 根问题 */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 104,
              fontSize: 25,
              fontWeight: 700,
              color: theme.text,
              border: `3px solid ${palette.primaryBright}`,
              borderRadius: 14,
              padding: "14px 22px",
              backgroundColor: alpha(palette.primary, 0.12),
              opacity: popAt(T.root),
              transform: `scale(${0.85 + popAt(T.root) * 0.15})`,
            }}
          >
            要不要懒？
          </div>

          {/* 追问（挂在「要」分支末端与 V5 之间的连线上，是树节点而非贴卡标签） */}
          <div
            style={{
              position: "absolute",
              left: 560,
              top: 198,
              fontSize: 24,
              fontWeight: 700,
              color: theme.text,
              border: `3px solid ${theme.warn}`,
              borderRadius: 14,
              padding: "13px 20px",
              backgroundColor: "rgba(255, 184, 77, 0.10)",
              opacity: popAt(T.ask),
              transform: `scale(${0.85 + popAt(T.ask) * 0.15})`,
            }}
          >
            还要防反射？
          </div>

          {/* 叶子结论 */}
          {[
            { v: "V1", r: "饿汉式 · 收工", y: 18, a: T.no + 6, hot: false },
            { v: "V4", r: "静态内部类 · 起步", y: 108, a: T.yes + 6, hot: false },
            { v: "V5", r: "枚举 · 封顶", y: 198, a: T.top + 6, hot: true },
          ].map((leaf) => (
            <div
              key={leaf.v}
              style={{
                position: "absolute",
                left: 1240,
                top: leaf.y,
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                fontSize: 24,
                color: theme.text,
                border: `2.5px solid ${leaf.hot ? theme.ok : palette.surfaceBorder}`,
                borderRadius: 12,
                padding: "10px 18px",
                backgroundColor: leaf.hot ? "rgba(63, 218, 140, 0.10)" : palette.surface,
                opacity: popAt(leaf.a),
                transform: `translateX(${(1 - popAt(leaf.a)) * 22}px)`,
                boxShadow:
                  leaf.hot && seenAt(leaf.a + 8) ? `0 0 26px rgba(63, 218, 140, 0.28)` : "none",
              }}
            >
              <span style={{ fontFamily: theme.font.mono, color: leaf.hot ? theme.ok : palette.primaryBright, fontSize: 22 }}>
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
