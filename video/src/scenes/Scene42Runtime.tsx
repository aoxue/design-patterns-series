import type { FC } from "react";
import { AbsoluteFill } from "remotion";
import { CodeCard, type CodeLine } from "../components/CodeCard";
import { theme } from "../theme";
import { useAnchors, type SceneProps } from "../scene-kit";

/**
 * 镜 4.2 · 影子一号 Runtime.getRuntime()（7:08–7:45）
 * 上：入口 + 三用途；下：JDK 源码（C8）与 V1（C2）并排「同款」盖章；尾：JDK 1.0 至今
 */
const JDK_SRC: CodeLine[] = [
  { segs: [{ text: "// java.lang.Runtime（JDK 源码节选）", kind: "comment" }] },
  {
    segs: [
      { text: "private static final " },
      { text: "Runtime currentRuntime", kind: "kw" },
      { text: " = " },
      { text: "new Runtime()", kind: "danger" },
      { text: ";" },
    ],
  },
  {
    segs: [
      { text: "public static Runtime " },
      { text: "getRuntime", kind: "kw" },
      { text: "() { return currentRuntime; }" },
    ],
  },
];

const V1_SRC: CodeLine[] = [
  { segs: [{ text: "// 我们的第一版（C2）", kind: "comment" }] },
  {
    segs: [
      { text: "private static final " },
      { text: "PromoConfigManager INSTANCE", kind: "kw" },
      { text: " = " },
      { text: "new PromoConfigManager()", kind: "danger" },
      { text: ";" },
    ],
  },
  {
    segs: [
      { text: "public static PromoConfigManager " },
      { text: "getInstance", kind: "kw" },
      { text: "() { return INSTANCE; }" },
    ],
  },
];

const USES = [
  { t: "availableProcessors()", d: "拿 CPU 核数", p: 0.05 },
  { t: "maxMemory()", d: "算堆内存上限", p: 0.07 },
  { t: "exec(\"…\")", d: "起一个进程", p: 0.09 },
];

export const Scene42Runtime: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { fade, pop } = useAnchors(leadFrames, audioFrames);

  return (
    <AbsoluteFill style={{ padding: "120px 90px 140px" }}>
      <div style={{ fontSize: 36, fontWeight: 700, color: theme.text, marginBottom: 20 }}>
        影子一号 · <span style={{ fontFamily: theme.font.mono, color: theme.primaryBright }}>Runtime.getRuntime()</span>
        <span style={{ fontSize: 24, color: theme.textMuted, fontWeight: 400 }}> —— 你天天在用</span>
      </div>

      {/* 三用途行 */}
      <div style={{ display: "flex", gap: 20, marginBottom: 26 }}>
        {USES.map((u) => (
          <div
            key={u.t}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 14,
              backgroundColor: theme.surface,
              border: `1px solid ${theme.surfaceBorder}`,
              borderRadius: 12,
              padding: "14px 22px",
              opacity: fade(u.p),
            }}
          >
            <span style={{ fontFamily: theme.font.mono, fontSize: 23, color: theme.primaryBright }}>{u.t}</span>
            <span style={{ fontSize: 22, color: theme.textMuted }}>{u.d}</span>
          </div>
        ))}
      </div>

      {/* 两段源码并排 + 同款印章 */}
      <div style={{ display: "flex", gap: 36, alignItems: "stretch", position: "relative" }}>
        <div style={{ flex: 1 }}>
          <CodeCard title="jdk/src/java.base/java/lang/Runtime.java" lines={JDK_SRC} revealAt={[0, 0, 0]} fontSize={19} />
        </div>

        {/* 同款印章（盖在两卡之间的缝隙上，缩小避免压住代码） */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: `translate(-50%, -50%) rotate(-12deg) scale(${pop(0.24)})`,
            fontSize: 27,
            fontWeight: 700,
            color: theme.warn,
            border: `3px solid ${theme.warn}`,
            borderRadius: 8,
            padding: "5px 14px",
            backgroundColor: "rgba(5, 7, 11, 0.9)",
            letterSpacing: 4,
            opacity: pop(0.24),
          }}
        >
          同 款
        </div>

        <div style={{ flex: 1 }}>
          <CodeCard title="PromoConfigManager.java · V1 饿汉式" lines={V1_SRC} revealAt={[0, 0, 0]} fontSize={19} />
        </div>
      </div>

      {/* 对照说明 */}
      <div
        style={{
          marginTop: 24,
          fontSize: 25,
          color: theme.text,
          textAlign: "center",
          opacity: fade(0.26),
        }}
      >
        static final 持有 · 私有构造 · 静态入口 —— 标准的<span style={{ color: theme.primaryBright, fontWeight: 700 }}>饿汉式</span>，
        和我们第一版一个模子刻出来的
      </div>

      {/* 底部结语条 */}
      <div
        style={{
          marginTop: "auto",
          borderRadius: 14,
          padding: "18px 30px",
          backgroundColor: "rgba(59, 130, 246, 0.10)",
          border: `1px solid ${theme.primary}`,
          display: "flex",
          alignItems: "center",
          gap: 24,
          fontSize: 26,
          color: theme.text,
          opacity: fade(0.36),
        }}
      >
        <span style={{ fontFamily: theme.font.mono, color: theme.primaryBright }}>JDK 1.0</span>
        {/* 图形化箭头线：文字箭头「——→」基线不齐，改真画的线 */}
        <div
          style={{
            width: 150,
            height: 2,
            backgroundColor: theme.surfaceBorder,
            position: "relative",
            margin: "0 14px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -1,
              top: -4,
              width: 0,
              height: 0,
              borderLeft: `9px solid ${theme.surfaceBorder}`,
              borderTop: "5px solid transparent",
              borderBottom: "5px solid transparent",
            }}
          />
        </div>
        <span>今天</span>
        <span style={{ marginLeft: "auto", color: theme.textMuted, fontSize: 23 }}>
          1996 年写好的单例，还在每一台 JVM 里跑
        </span>
      </div>
    </AbsoluteFill>
  );
};
