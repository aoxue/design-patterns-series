import type { FC } from "react";
import { AbsoluteFill } from "remotion";
import { alpha, theme } from "../../theme";
import { useAnchors, type SceneProps, usePalette } from "../../scene-kit";

/**
 * 镜 5.1 族 · 什么时候别用（9:05–10:39，v4 自旧 5.1 拆为三镜）差异化核心段
 * 5.1a Scene51aGlobal：第一张警告卡压屏（⚠ 全局变量）
 * 5.1b Scene51bState：第二张警告卡压屏（⚠ 状态炸弹）
 * 5.1c Scene51cTest：第三张警告卡（⚠ 难测试）＋正解依赖注入＋第四张小卡「工具类 ≠ 单例」；
 *                     尾段画面渐暗，为片尾金句蓄力
 * 三镜共用大卡布局与进度 chip；行文案全部取自台词原文，锚点=关键词字位。
 * 拆镜适配：废除旧整镜的 CSS transition 与 scale 强调（纪律：帧驱动 + 强调只用颜色/光晕/透明度）。
 */

/** 警告进度 chip：done=已讲（✓ 灰）/ active=正在讲（红）/ todo=未讲（仅序号，不剧透标题） */
const WarnChip: FC<{ label: string; mode: "done" | "active" | "todo"; opacity?: number }> = ({
  label,
  mode,
  opacity = 1,
}) => {
  const palette = usePalette();
  const active = mode === "active";
  return (
    <span
      style={{
        fontSize: 23,
        fontFamily: theme.font.mono,
        color: active ? theme.danger : theme.textMuted,
        border: `1px solid ${active ? theme.danger : palette.surfaceBorder}`,
        borderRadius: 999,
        padding: "4px 18px",
        backgroundColor: active ? alpha(theme.danger, 0.1) : "transparent",
        opacity: mode === "todo" ? opacity * 0.45 : opacity,
      }}
    >
      {mode === "done" ? `✓ ${label}` : label}
    </span>
  );
};

/** 大警告卡（压屏主体）：icon + 标题 + 逐行点亮 */
const WarnCard: FC<{
  icon: string;
  no: number;
  title: string;
  rows: { text: string; p: number }[];
  fade: (p: number, dur?: number) => number;
}> = ({ icon, no, title, rows, fade }) => {
  const palette = usePalette();
  return (
    <div
      style={{
        width: 1120,
        backgroundColor: palette.surface,
        border: `2px solid ${theme.danger}`,
        borderRadius: 20,
        padding: "34px 44px",
        boxShadow: `0 0 44px ${alpha(theme.danger, 0.14)}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
        <span style={{ fontSize: 52 }}>{icon}</span>
        <span style={{ fontSize: 34, fontWeight: 700, color: theme.danger }}>
          {no}. {title}
        </span>
      </div>
      {rows.map((r) => (
        <div key={r.text} style={{ fontSize: 26, color: theme.text, lineHeight: 2.05, opacity: fade(r.p) }}>
          · {r.text}
        </div>
      ))}
    </div>
  );
};

/** 段落公共头（三镜同构，保证镜间衔接不跳） */
const SectionHeader: FC = () => (
  <div style={{ fontSize: 36, fontWeight: 700, color: theme.text }}>
    什么时候<span style={{ color: theme.danger }}>别用</span>它
    <span style={{ fontSize: 24, color: theme.textMuted, fontWeight: 400 }}> · 本期最重要的段落 · 三条警告</span>
  </div>
);

/** ---------------------------------------------------------------- 5.1a · 警告一：全局变量 */
export const Scene51aGlobal: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { fade, pop, seen } = useAnchors(leadFrames, audioFrames);
  // 锚点（subtitle 108 字）：三条警告 0.213 / 第一 0.259 / 类名一点 0.389 /
  // 依赖关系 0.593 / 今天爽 0.806
  const chipsIn = fade(0.213);

  return (
    <AbsoluteFill style={{ padding: "108px 90px 150px" }}>
      <SectionHeader />
      <div style={{ display: "flex", gap: 16, marginTop: 26 }}>
        <WarnChip
          label={seen(0.259) ? "① 全局变量" : "①"}
          mode={seen(0.259) ? "active" : "todo"}
          opacity={chipsIn}
        />
        <WarnChip label="②" mode="todo" opacity={chipsIn} />
        <WarnChip label="③" mode="todo" opacity={chipsIn} />
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ opacity: pop(0.259) }}>
          <WarnCard
            icon="🌍"
            no={1}
            title="单例的本质是全局变量"
            fade={fade}
            rows={[
              { text: "类名一点，哪里都能 getInstance", p: 0.389 },
              { text: "依赖关系不体现在方法签名里，而是藏进代码暗处", p: 0.593 },
              { text: "今天爽，三个月后重构时，它从暗处给你一刀", p: 0.806 },
            ]}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** ---------------------------------------------------------------- 5.1b · 警告二：状态炸弹 */
export const Scene51bState: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { fade, pop } = useAnchors(leadFrames, audioFrames);
  // 锚点（subtitle 268 字）：只创建一次 0.090 / 可变字段 0.134 / 创建安全 0.265 /
  // 悄悄覆盖 0.672 / HashMap 0.690 / 写坏 0.765 / 解法 0.810
  return (
    <AbsoluteFill style={{ padding: "108px 90px 150px" }}>
      <SectionHeader />
      <div style={{ display: "flex", gap: 16, marginTop: 26 }}>
        <WarnChip label="① 全局变量" mode="done" />
        <WarnChip label="② 状态炸弹" mode="active" />
        <WarnChip label="③" mode="todo" />
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ opacity: pop(0) }}>
          <WarnCard
            icon="💣"
            no={2}
            title="有状态单例是并发炸弹"
            fade={fade}
            rows={[
              { text: "今天五版代码防的只是「只创建一次」", p: 0.09 },
              { text: "实例里的可变字段：缓存的 Map、随手 set 的成员变量，并发读写照样出事", p: 0.134 },
              { text: "创建安全，不等于使用安全", p: 0.265 },
              { text: "线程 A 一查没有正要写，线程 B 也查也写：一边的结果被另一边悄悄覆盖", p: 0.672 },
              { text: "HashMap 并发写甚至把内部结构写坏，整台服务卡死", p: 0.765 },
              { text: "解法不在单例模式里：ConcurrentHashMap / 写路径加锁 / 干脆无状态", p: 0.81 },
            ]}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** ---------------------------------------------------------------- 5.1c · 警告三：难测试 ＋ 正解 ＋ 小卡 */
export const Scene51cTest: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { fade, pop } = useAnchors(leadFrames, audioFrames);
  const palette = usePalette();
  // 锚点（subtitle 131 字）：写死在调用处 0.145 / 插不进 0.282 / 正解依赖注入 0.313 /
  // 过度设计 0.725 / 收尾渐暗 0.95
  const dim = fade(0.95, 25) * 0.55;

  return (
    <AbsoluteFill style={{ padding: "108px 90px 150px" }}>
      <SectionHeader />
      <div style={{ display: "flex", gap: 16, marginTop: 26 }}>
        <WarnChip label="① 全局变量" mode="done" />
        <WarnChip label="② 状态炸弹" mode="done" />
        <WarnChip label="③ 难测试" mode="active" />
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
        }}
      >
        <div style={{ opacity: pop(0) }}>
          <WarnCard
            icon="🧪"
            no={3}
            title="难测试"
            fade={fade}
            rows={[
              { text: "getInstance 写死在调用处", p: 0.145 },
              { text: "单测想塞个假实现进去？插不进", p: 0.282 },
            ]}
          />
        </div>

        {/* 正解条：依赖注入（台词「正解是依赖注入」段） */}
        <div
          style={{
            width: 1120,
            borderRadius: 16,
            padding: "20px 34px",
            backgroundColor: alpha(theme.ok, 0.08),
            border: `2px solid ${theme.ok}`,
            display: "flex",
            alignItems: "center",
            gap: 26,
            opacity: fade(0.313),
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
            width: 1120,
            display: "flex",
            alignItems: "center",
            gap: 18,
            backgroundColor: palette.surface,
            border: `1px dashed ${palette.surfaceBorder}`,
            borderRadius: 12,
            padding: "14px 26px",
            opacity: fade(0.725),
          }}
        >
          <span style={{ fontSize: 24 }}>🧰 常见过度设计</span>
          <span style={{ fontSize: 24, color: theme.text }}>
            无状态的工具类，一堆 <span style={{ fontFamily: theme.font.mono, color: palette.primaryBright }}>static</span>{" "}
            方法就够，<span style={{ color: theme.warn }}>别硬套单例的壳</span>
          </span>
        </div>
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
