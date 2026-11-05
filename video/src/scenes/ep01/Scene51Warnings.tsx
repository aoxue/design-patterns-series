import type { FC } from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../../theme";
import { useAnchors, type SceneProps, usePalette } from "../../scene-kit";

/**
 * 镜 5.1 · 什么时候别用（8:30–9:30）差异化核心段
 * 三张警告卡逐张点亮（全局变量 / 状态炸弹 / 难测试）→ 正解：依赖注入 → 工具类小卡；
 * 尾段画面渐暗蓄力，为片尾金句让位
 */
/** 锚点 = 台词字位（扩写后 505 字）：第一 0.050 / 第二 0.208 / 第三 0.741 / 正解 0.822 / 工具类 0.947 */
const WARNINGS = [
  {
    icon: "🌍",
    title: "单例的本质是全局变量",
    lines: [
      "类名一点，哪里都能 getInstance",
      "依赖不体现在方法签名里，藏进代码暗处",
      "今天爽，三个月后重构时给你一刀",
    ],
    p: 0.050,
    active: [0.050, 0.208],
  },
  {
    icon: "💣",
    title: "有状态单例是并发炸弹",
    lines: [
      "五版代码防的只是「只创建一次」",
      "写入覆盖、读到脏数据，HashMap 并发写甚至写坏结构",
      "模式管个数，不管使用：解法在锁 / 无状态",
    ],
    p: 0.208,
    active: [0.208, 0.741],
  },
  {
    icon: "🧪",
    title: "难测试",
    lines: ["getInstance 写死在调用处", "单测想塞个假实现进去？插不进", "依赖藏得越深，mock 越痛"],
    p: 0.741,
    active: [0.741, 0.822],
  },
];

export const Scene51Warnings: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, at, fade, seen } = useAnchors(leadFrames, audioFrames);
  const palette = usePalette();

  // 尾段渐暗：台词最后一个字（≈0.99）后压暗，只留正解条（为片尾金句蓄力）
  const dim = fade(0.99, 20) * 0.55;

  return (
    <AbsoluteFill style={{ padding: "118px 90px 140px" }}>
      <div style={{ fontSize: 36, fontWeight: 700, color: theme.text, marginBottom: 26 }}>
        什么时候<span style={{ color: theme.danger }}>别用</span>它
        <span style={{ fontSize: 24, color: theme.textMuted, fontWeight: 400 }}> · 本期最重要的段落 · 三条警告</span>
      </div>

      {/* 三张警告卡横排，讲到哪张点亮哪张 */}
      <div style={{ display: "flex", gap: 26, opacity: 1 - dim }}>
        {WARNINGS.map((w, i) => {
          const on = seen(w.p);
          const isHot = on && !seen(w.active[1]); // 正在讲：高亮
          return (
            <div
              key={w.title}
              style={{
                flex: 1,
                backgroundColor: palette.surface,
                border: `2px solid ${isHot ? theme.danger : palette.surfaceBorder}`,
                borderRadius: 16,
                padding: "24px 26px",
                opacity: on ? 1 : 0.22,
                transform: `translateY(${on ? 0 : 14}px) scale(${isHot ? 1.02 : 1})`,
                transition: "transform 300ms",
                boxShadow: isHot ? `0 0 36px rgba(255, 82, 82, 0.22)` : "none",
              }}
            >
              <div style={{ fontSize: 44, marginBottom: 12 }}>{w.icon}</div>
              <div style={{ fontSize: 27, fontWeight: 700, color: isHot ? theme.danger : theme.text, marginBottom: 14 }}>
                {i + 1}. {w.title}
              </div>
              {w.lines.map((l) => (
                <div key={l} style={{ fontSize: 21, color: theme.textMuted, lineHeight: 1.75 }}>
                  · {l}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* 正解条：依赖注入 */}
      <div
        style={{
          marginTop: 30,
          borderRadius: 16,
          padding: "22px 34px",
          backgroundColor: "rgba(63, 218, 140, 0.08)",
          border: `2px solid ${theme.ok}`,
          display: "flex",
          alignItems: "center",
          gap: 26,
          opacity: Math.max(fade(0.822), dim > 0 ? 1 : 0) ,
        }}
      >
        <span style={{ fontSize: 30 }}>✅ 正解</span>
        <div style={{ fontSize: 26, color: theme.text }}>
          <span style={{ color: theme.ok, fontWeight: 700 }}>依赖注入</span>：实例从「自己全局去拿」变成「
          <span style={{ color: theme.ok, fontWeight: 700 }}>外面递进来</span>」，这正是刚才 Spring 影子的深意
        </div>
      </div>

      {/* 第四张小卡：工具类 ≠ 单例 */}
      <div
        style={{
          marginTop: 18,
          display: "flex",
          alignItems: "center",
          gap: 18,
          backgroundColor: palette.surface,
          border: `1px dashed ${palette.surfaceBorder}`,
          borderRadius: 12,
          padding: "14px 26px",
          opacity: fade(0.947),
        }}
      >
        <span style={{ fontSize: 24 }}>🧰 常见过度设计</span>
        <span style={{ fontSize: 24, color: theme.text }}>
          无状态的工具类，一堆 <span style={{ fontFamily: theme.font.mono, color: palette.primaryBright }}>static</span> 方法就够，
          <span style={{ color: theme.warn }}>别硬套单例的壳</span>
        </span>
      </div>

      {/* 尾段渐暗罩层：黑幕压下来，为片尾金句蓄力（6.1 金句自然衔接） */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: theme.deepBg,
          opacity: dim,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
