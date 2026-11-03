import type { FC } from "react";
import { AbsoluteFill } from "remotion";
import { CodeCard, type CodeLine } from "../components/CodeCard";
import { theme } from "../theme";
import { useAnchors, type SceneProps } from "../scene-kit";

/**
 * 镜 2.5 · V5 枚举 + 反射攻击实录（4:20–5:30）
 * 左卡切换：C6 枚举（0–0.2）→ C7 攻击代码；右：Maven 真实运行输出（禁止编造）；
 * 下：五版本徽标墙，V1–V4 中弹碎裂，V5 盾牌弹开；尾：三徽章压轴理由
 */

/** C6 枚举（脚本代码卡原文） */
const C6: CodeLine[] = [
  { segs: [{ text: "public enum " }, { text: "PromoConfigManager", kind: "kw" }, { text: " {" }] },
  {
    segs: [
      { text: "    " },
      { text: "INSTANCE", kind: "danger" },
      { text: ";                                     // 这一行，就是单例", kind: "comment" },
    ],
  },
  { segs: [{ text: "    public int getDiscount(int amount) { /* 查规则，同前 */ }" }] },
  { segs: [{ text: "}" }] },
];

/** C7 反射攻击（脚本代码卡原文 + 枚举波结果行） */
const C7: CodeLine[] = [
  { segs: [{ text: "// 攻击方：反射拆 private 构造器", kind: "comment" }] },
  { segs: [{ text: "var ctor = PromoConfigManager.class." }, { text: "getDeclaredConstructor", kind: "kw" }, { text: "();" }] },
  {
    segs: [
      { text: "ctor." },
      { text: "setAccessible(true)", kind: "danger" },
      { text: ";                        // 撬开 private", kind: "comment" },
    ],
  },
  { segs: [{ text: "PromoConfigManager ghost = ctor." }, { text: "newInstance", kind: "kw" }, { text: "();" }] },
  {
    segs: [
      { text: "System.out.println(ghost == PromoConfigManager.getInstance());" },
    ],
  },
  { segs: [{ text: "// → false：V1–V4 全线失守", kind: "comment" }] },
  { segs: [{ text: "// 枚举：newInstance 抛 IllegalArgumentException：JVM 拒绝", kind: "comment" }] },
];

/** Maven 真实运行输出（2026-11-02 实测，mashanggou SingletonEvolutionDemo 第三幕）。
 *  link = 由代码执行直接产生（▸ 前缀与代码卡 ▶ 执行游标配对，同刻出现） */
const TERMINAL: { p: number; text: string; kind: "cmd" | "out" | "hot"; link?: boolean }[] = [
  { p: 0.23, text: "$ mvn -q compile exec:java -Dexec.mainClass=…SingletonEvolutionDemo", kind: "cmd" },
  { p: 0.24, text: "=== 第三幕 · 反射攻击（C7） ===", kind: "out" },
  { p: 0.355, text: "攻击 V1 饿汉式（普通类）: ghost == getInstance() → false", kind: "hot", link: true },
  { p: 0.365, text: "            ← 失守！第二个实例诞生", kind: "hot", link: true },
  { p: 0.545, text: "攻击 V5 枚举: java.lang.IllegalArgumentException:", kind: "hot", link: true },
  { p: 0.555, text: "            Cannot reflectively create enum objects", kind: "hot", link: true },
  { p: 0.62, text: "← JVM 在语言层面焊死了这扇门", kind: "out" },
];

/** 两波「执行重放」：代码行依次点亮（▶ 游标），输出恰在产生它的行执行时落地。
 *  第一波打普通类（println 印出 false）；第二波打枚举（newInstance 抛异常） */
const WAVES = [
  { start: 0.24, step: 0.035, lines: [1, 2, 3, 4] },
  { start: 0.5, step: 0.02, lines: [1, 2, 3] },
];

const execActive = (p: number) => {
  let active = -1;
  for (const w of WAVES) {
    const end = w.start + w.lines.length * w.step + 0.015;
    if (p >= w.start && p < end) {
      const k = Math.min(Math.floor((p - w.start) / w.step), w.lines.length - 1);
      active = w.lines[k];
    }
  }
  return active;
};

const C7_VIS = [0.23, 0.24, 0.275, 0.31, 0.345, 0.365, 0.56];

export const Scene25Enum: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, at, fade, pop, seen } = useAnchors(leadFrames, audioFrames);
  // 台词进度 0–1：驱动两波执行重放的游标
  const p = Math.max(0, Math.min((frame - leadFrames) / audioFrames, 1));

  const showAttack = seen(0.2); // 0.2 起 C6 淡出、C7 进场
  const c6Out = 1 - fade(0.2, 8);
  const ejBadge = pop(0.03); // Effective Java 徽章
  // V1–V4 碎裂抖动（0.38 处一次脉冲）；V5 盾牌 0.54 弹开
  const smashT = frame - at(0.38);
  const smash = smashT > 0 && smashT < 12 ? Math.abs(Math.sin(smashT / 1.8)) : 0;
  const shield = pop(0.56);
  const finaleBadges = ["防反射", "防序列化", "代码最短"];

  return (
    <AbsoluteFill style={{ padding: "118px 90px 140px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: theme.text }}>
          <span style={{ fontFamily: theme.font.mono, color: theme.primaryBright }}>V5</span> 单元素枚举 · 压轴
        </div>
        <span
          style={{
            fontSize: 22,
            color: theme.warn,
            border: `1px solid ${theme.warn}`,
            borderRadius: 999,
            padding: "3px 16px",
            opacity: ejBadge,
          }}
        >
          Effective Java 钦定
        </span>
        <span style={{ fontSize: 23, color: theme.textMuted, opacity: fade(0.12) }}>
          现代 Java：让模式隐身，一个词解决的事，不写十行
        </span>
      </div>

      <div style={{ display: "flex", gap: 36, height: 470 }}>
        {/* 左：C6 → C7 切换 */}
        <div style={{ flex: 1.15, position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, opacity: c6Out }}>
            <CodeCard title="PromoConfigManager.java · V5 枚举" lines={C6} revealAt={[0, 0, 0, 0]} fontSize={21} />
          </div>
          <div style={{ position: "absolute", inset: 0, opacity: fade(0.21), pointerEvents: "none" }}>
            <CodeCard
              title="ReflectionAttack.java · 攻击方"
              lines={C7}
              revealAt={C7_VIS.map(at)}
              fontSize={21}
              activeLine={execActive(p)}
            />
          </div>
          {/* 攻击目标标签：第一波打 V1 普通类，第二波切 V5 枚举 */}
          <div
            style={{
              position: "absolute",
              top: -8,
              right: 0,
              fontSize: 21,
              fontWeight: 700,
              fontFamily: theme.font.mono,
              color: seen(0.5) ? theme.ok : theme.warn,
              border: `2px solid ${seen(0.5) ? theme.ok : theme.warn}`,
              borderRadius: 8,
              padding: "4px 14px",
              backgroundColor: theme.deepBg,
              opacity: fade(0.24, 8),
            }}
          >
            {seen(0.5) ? "目标 → V5 枚举" : "目标 → V1 普通类"}
          </div>
        </div>

        {/* 右：终端实录（真实输出） */}
        <div
          style={{
            flex: 1,
            backgroundColor: theme.deepBg,
            border: `1px solid ${theme.surfaceBorder}`,
            borderRadius: 14,
            padding: "18px 24px",
            fontFamily: theme.font.mono,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ fontSize: 20, color: theme.textMuted, marginBottom: 12 }}>
            终端 · mashanggou 真实运行实录
          </div>
          {TERMINAL.map((l, i) => (
            <div
              key={i}
              style={{
                fontSize: 19,
                lineHeight: 1.85,
                whiteSpace: "nowrap",
                color: l.kind === "cmd" ? theme.ok : l.kind === "hot" ? theme.danger : theme.text,
                opacity: fade(l.p),
                fontWeight: l.kind === "hot" ? 700 : 400,
              }}
            >
              {l.link && <span style={{ color: theme.primaryBright, marginRight: 8 }}>▸</span>}
              {l.text}
            </div>
          ))}
        </div>
      </div>

        {/* 下：五版本徽标墙，攻击箭头射向五版（每个圆环标注版本名，失守/弹开状态写在名下） */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 26, marginTop: 10 }}>
        <span style={{ fontSize: 30, color: theme.danger, opacity: fade(0.3) }}>🟥 攻击命中 →</span>
        {["V1", "V2", "V3", "V4", "V5"].map((v, i) => {
          const dead = i < 4 && seen(0.38);
          const isShield = i === 4;
          const name = ["饿汉式", "懒汉式", "双检锁", "静态内部类", "枚举"][i];
          return (
            <div key={v} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: "50%",
                  border: `4px solid ${dead ? theme.danger : isShield ? theme.ok : theme.surfaceBorder}`,
                  backgroundColor: dead
                    ? "rgba(255, 82, 82, 0.14)"
                    : isShield
                      ? "rgba(63, 218, 140, 0.12)"
                      : "rgba(10, 24, 38, 0.8)",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontFamily: theme.font.mono,
                  fontSize: 30,
                  color: dead ? theme.danger : isShield ? theme.ok : theme.textMuted,
                  transform: `translateY(${dead ? smash * 6 : 0}px) rotate(${dead ? smash * 4 : 0}deg) scale(${isShield ? 0.96 + shield * 0.04 : 1})`,
                  boxShadow: isShield && shield > 0.5 ? `0 0 40px rgba(63, 218, 140, 0.35)` : "none",
                  opacity: i === 4 ? (dead ? 1 : 0.55 + shield * 0.45) : 1,
                }}
              >
                {dead ? "💥" : isShield ? "🛡" : v}
              </div>
              <div style={{ fontSize: 21, color: dead ? theme.danger : isShield ? theme.ok : theme.textMuted }}>
                {name}
                {dead ? " · 失守" : ""}
                {isShield && shield > 0.5 ? " · 弹开" : ""}
              </div>
            </div>
          );
        })}

        {/* 压轴三徽章 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginLeft: 20 }}>
          {finaleBadges.map((b, i) => (
            <span
              key={b}
              style={{
                fontSize: 23,
                color: theme.ok,
                border: `1px solid ${theme.ok}`,
                borderRadius: 999,
                padding: "5px 18px",
                textAlign: "center",
                opacity: pop(0.72 + i * 0.03),
                backgroundColor: "rgba(63, 218, 140, 0.08)",
              }}
            >
              {b} ✓
            </span>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
