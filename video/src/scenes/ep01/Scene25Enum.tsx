import type { FC } from "react";
import { AbsoluteFill } from "remotion";
import { CodeCard, type CodeLine } from "../../components/CodeCard";
import { alpha, theme } from "../../theme";
import { useAnchors, type SceneProps, usePalette } from "../../scene-kit";

/**
 * 镜 2.5 族 · V5 枚举与反射攻击现场（5:08–6:17，v4 自旧 2.5 拆为三镜）
 * 2.5a Scene25aEnum：C6 代码卡出现，INSTANCE 一词高亮呼吸
 * 2.5b Scene25bAttack：C7 攻击代码 + Maven 真实运行实录（控制台 false 红字）；
 *                      攻击箭头射向五版本徽标墙，V1–V4 碎裂
 * 2.5c Scene25cShield：炮弹打向枚举被 JVM 拦下，Exception 轨迹红字；V5 盾牌弹开；
 *                      「Cannot reflectively create enum objects」定格；压轴三徽章
 * 三镜共用 C6/C7/终端实录/徽标墙（同族内容，拆镜后各按自己的台词字位重算锚点）
 */

/** C6 枚举（脚本代码卡原文；getDiscount 三行形态与 PromoConfigManagerV5 真实源码一致） */
const C6: CodeLine[] = [
  { segs: [{ text: "public enum " }, { text: "PromoConfigManager", kind: "kw" }, { text: " {" }] },
  {
    segs: [
      { text: "    " },
      { text: "INSTANCE", kind: "danger", pulse: true },
      { text: ";  // 这一行，就是单例", kind: "comment" },
    ],
  },
  { segs: [{ text: "    public int getDiscount(int amount) {" }] },
  { segs: [{ text: "        return amount >= 300 ? 80 : 0;" }] },
  { segs: [{ text: "    }" }] },
  { segs: [{ text: "}" }] },
];

/** C7 反射攻击（脚本代码卡原文 + 枚举波结果行；行 7 归 2.5c） */
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

/** Maven 真实运行输出（2026-11-02 实测，mashanggou SingletonEvolutionDemo 第三幕，禁止编造）。
 *  行的出现时机（opacity/link）由各镜按自己的台词字位传入；▸ 前缀与代码卡 ▶ 执行游标配对 */
interface TermRowData {
  text: string;
  kind: "cmd" | "out" | "hot";
  opacity: number;
  link?: boolean;
}

/** 执行重放波：{starts: 各行点亮台词进度（= 该行 revealAt 词位）, lines: 对应 C7 行号, end: 波结束进度}。
 *  starts 逐行给字位而非等距步进：▶ 游标与代码行揭示、台词念词三者同帧锁死
 *  （QA 实拍教训：等距步进会在第二步早于行揭示 ~10 帧，游标指向尚未显现的行） */
interface Wave {
  starts: number[];
  lines: number[];
  end: number;
}

/** 当前 ▶ 游标行：波内最后一条已点亮的行（帧驱动，经 at() 走实测时间轴） */
const waveActive = (waves: Wave[], at: (p: number) => number, frame: number): number => {
  let active = -1;
  for (const w of waves) {
    if (frame >= at(w.starts[0]) && frame < at(w.end)) {
      for (let k = 0; k < w.lines.length; k++) {
        if (frame >= at(w.starts[k])) active = w.lines[k];
      }
    }
  }
  return active;
};

/** 终端实录壳（真实输出专用） */
const TerminalShell: FC<{ rows: TermRowData[] }> = ({ rows }) => {
  const palette = usePalette();
  return (
    <div
      style={{
        flex: 1,
        backgroundColor: theme.deepBg,
        border: `1px solid ${palette.surfaceBorder}`,
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
      {rows.map((l, i) => (
        <div
          key={i}
          style={{
            fontSize: 19,
            lineHeight: 1.85,
            whiteSpace: "nowrap",
            color: l.kind === "cmd" ? theme.ok : l.kind === "hot" ? theme.danger : theme.text,
            opacity: l.opacity,
            fontWeight: l.kind === "hot" ? 700 : 400,
          }}
        >
          {l.link && <span style={{ color: palette.primaryBright, marginRight: 8 }}>▸</span>}
          {l.text}
        </div>
      ))}
    </div>
  );
};

/** 攻击目标标签：第一波打 V1 普通类，第二波（2.5c）切 V5 枚举 */
const TargetTag: FC<{ v5: boolean; opacity: number }> = ({ v5, opacity }) => (
  <div
    style={{
      position: "absolute",
      top: -8,
      right: 0,
      fontSize: 21,
      fontWeight: 700,
      fontFamily: theme.font.mono,
      color: v5 ? theme.ok : theme.warn,
      border: `2px solid ${v5 ? theme.ok : theme.warn}`,
      borderRadius: 8,
      padding: "4px 14px",
      backgroundColor: theme.deepBg,
      opacity,
    }}
  >
    {v5 ? "目标 → V5 枚举" : "目标 → V1 普通类"}
  </div>
);

/** 五版本徽标墙：V1–V4 失守碎裂（smash 一次性抖动脉冲），V5 盾牌弹开（shield spring） */
const BadgeWall: FC<{ arrowOpacity: number; dead: boolean; smash: number; shield: number }> = ({
  arrowOpacity,
  dead,
  smash,
  shield,
}) => {
  const palette = usePalette();
  const names = ["饿汉式", "懒汉式", "双检锁", "静态内部类", "枚举"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
      <span style={{ fontSize: 30, color: theme.danger, opacity: arrowOpacity }}>🟥 攻击命中 →</span>
      {["V1", "V2", "V3", "V4", "V5"].map((v, i) => {
        const isV5 = i === 4;
        const shielded = isV5 && shield > 0.5;
        const fell = dead && !isV5;
        return (
          <div key={v} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 110,
                height: 110,
                borderRadius: "50%",
                border: `4px solid ${fell ? theme.danger : shielded ? theme.ok : palette.surfaceBorder}`,
                backgroundColor: fell ? theme.diffDel : shielded ? theme.diffAdd : alpha(palette.bg, 0.8),
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontFamily: theme.font.mono,
                fontSize: 30,
                color: fell ? theme.danger : shielded ? theme.ok : theme.textMuted,
                transform: `translateY(${fell ? smash * 6 : 0}px) rotate(${fell ? smash * 4 : 0}deg)`,
                boxShadow: shielded ? `0 0 40px ${alpha(theme.ok, 0.35)}` : "none",
                opacity: isV5 ? 0.55 + shield * 0.45 : 1,
              }}
            >
              {fell ? "💥" : shielded ? "🛡" : v}
            </div>
            <div style={{ fontSize: 21, color: fell ? theme.danger : shielded ? theme.ok : theme.textMuted }}>
              {names[i]}
              {fell ? " · 失守" : ""}
              {shielded ? " · 弹开" : ""}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** ---------------------------------------------------------------- 2.5a · C6 枚举 */
export const Scene25aEnum: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { at, fade, pop } = useAnchors(leadFrames, audioFrames);
  const palette = usePalette();
  // 锚点（subtitle 101 字）：单元素枚举 0.069 / Effective Java 0.129 / INSTANCE 0.356 /
  // 单例就成了 0.525（INSTANCE 呼吸收口）/ 字段方法照常写 0.584 / 现代 Java 0.693
  const revealAt = [at(0.069), at(0.356), at(0.584), at(0.584), at(0.584), at(0.584)];

  return (
    <AbsoluteFill style={{ padding: "108px 150px 150px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: theme.text }}>
          <span style={{ fontFamily: theme.font.mono, color: palette.primaryBright }}>V5</span> 单元素枚举 · 压轴
        </div>
        <span
          style={{
            fontSize: 22,
            color: theme.warn,
            border: `1px solid ${theme.warn}`,
            borderRadius: 999,
            padding: "3px 16px",
            opacity: pop(0.129),
          }}
        >
          Effective Java 钦定
        </span>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 980 }}>
          <CodeCard
            title="PromoConfigManager.java · V5 枚举"
            lines={C6}
            revealAt={revealAt}
            fontSize={26}
            pulseWindows={[[at(0.356), at(0.525) + 8]]}
          />
        </div>
        {/* 台词原文收条：「现代 Java 的态度」段落的落版 */}
        <div style={{ marginTop: 26, fontSize: 24, color: theme.textMuted, opacity: fade(0.693) }}>
          现代 Java 的态度：让模式隐身，一个词解决的事，不写十行
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** ---------------------------------------------------------------- 2.5b · 反射攻击 V1 */
export const Scene25bAttack: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, at, fade, seen } = useAnchors(leadFrames, audioFrames);
  // 锚点（subtitle 244 字）：演一场攻击 0.070 / 反射攻击 0.094 / 专拆 private 0.115 /
  // getDeclaredConstructor 0.160 / setAccessible 0.279 / newInstance 0.381 / ghost 0.492 /
  // 全线失守 0.533 / false 0.648 / 第二个实例 0.693 / 反序列化 0.869
  // false 结果行提前到 0.62（「ghost == getInstance() 印出来…」句首附近起淡入）：
  // 0.648（词位）起淡的话，红字完整可见要滞后台词半秒（QA 实拍教训）
  const revealAt = [at(0.094), at(0.16), at(0.279), at(0.381), at(0.492), at(0.62), Infinity];
  // ▶ 游标四步 = 台词四个攻击动词字位，与各行 revealAt 同帧：0.160 / 0.279 / 0.381 / 0.492
  const waves: Wave[] = [{ starts: [0.16, 0.279, 0.381, 0.492], lines: [1, 2, 3, 4], end: 0.55 }];
  // V1–V4 碎裂：一次性 12 帧抖动脉冲，之后定格失守态
  const smashT = frame - at(0.533);
  const smash = smashT > 0 && smashT < 12 ? Math.abs(Math.sin(smashT / 1.8)) : 0;

  return (
    <AbsoluteFill style={{ padding: "108px 90px 150px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 16 }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: theme.text }}>
          <span style={{ color: theme.warn }}>反射攻击</span> · 专拆 private
        </div>
        <span style={{ fontSize: 23, color: theme.textMuted, opacity: fade(0.869) }}>
          攻击不一定来自同事：反序列化、某些框架按 class 反建对象，走的都是同一条暗道
        </span>
      </div>

      <div style={{ display: "flex", gap: 36, height: 410 }}>
        {/* 左：C7 攻击代码（▶ 游标随台词逐步执行） */}
        <div style={{ flex: 1.15, position: "relative" }}>
          <CodeCard
            title="ReflectionAttack.java · 攻击方"
            lines={C7}
            revealAt={revealAt}
            fontSize={21}
            activeLine={waveActive(waves, at, frame)}
          />
          <TargetTag v5={false} opacity={fade(0.115, 8)} />
        </div>

        {/* 右：终端实录（真实输出，false 红字） */}
        <TerminalShell
          rows={[
            {
              text: "$ mvn -q compile exec:java -Dexec.mainClass=…SingletonEvolutionDemo",
              kind: "cmd",
              opacity: fade(0.07),
            },
            { text: "=== 第三幕 · 反射攻击（C7） ===", kind: "out", opacity: fade(0.094) },
            {
              text: "攻击 V1 饿汉式（普通类）: ghost == getInstance() → false",
              kind: "hot",
              opacity: fade(0.62),
              link: true,
            },
            {
              text: "            ← 失守！第二个实例诞生",
              kind: "hot",
              opacity: fade(0.693),
              link: true,
            },
          ]}
        />
      </div>

      {/* 下：五版本徽标墙，V1–V4 中弹碎裂 */}
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <BadgeWall arrowOpacity={fade(0.16)} dead={seen(0.533)} smash={smash} shield={0} />
      </div>
    </AbsoluteFill>
  );
};

/** ---------------------------------------------------------------- 2.5c · 炮弹打向枚举 */
export const Scene25cShield: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, at, fade, pop } = useAnchors(leadFrames, audioFrames);
  const palette = usePalette();
  // 锚点（subtitle 156 字）：打向枚举 0.032 / newInstance 0.083 / 拦下 0.212 /
  // IllegalArgumentException 0.244 / 报错原文 0.404 / 焊死 0.635 /
  // 防反射 0.814 / 防序列化 0.840 / 代码最短 0.872
  const base = leadFrames; // C7 前六行承接 2.5b（续镜快闪复位），行 7 等异常实锤
  const revealAt = [base, base + 2, base + 4, base + 6, base + 8, base + 10, at(0.244)];
  // 炮弹回放三步游标（ctor → setAccessible → newInstance），拦截点 0.244 波结束
  const waves: Wave[] = [{ starts: [0.083, 0.133, 0.183], lines: [1, 2, 3], end: 0.244 }];
  const shield = pop(0.212); // newInstance 被 JVM 拦下：V5 盾牌弹开
  const finaleBadges = ["防反射", "防序列化", "代码最短"];
  const finaleAt = [0.814, 0.84, 0.872];

  return (
    <AbsoluteFill style={{ padding: "108px 90px 150px" }}>
      <div style={{ fontSize: 36, fontWeight: 700, color: theme.text, marginBottom: 16 }}>
        <span style={{ fontFamily: theme.font.mono, color: palette.primaryBright }}>V5</span> 单元素枚举 · 压轴的理由
        <span style={{ fontSize: 23, color: theme.textMuted, fontWeight: 400, marginLeft: 14 }}>
          防反射、防序列化、代码最短，三项全包
        </span>
      </div>

      <div style={{ display: "flex", gap: 36, height: 380 }}>
        {/* 左：C7 续（攻击代码回放一轮，枚举波结果行落地） */}
        <div style={{ flex: 1.15, position: "relative" }}>
          <CodeCard
            title="ReflectionAttack.java · 攻击方（续）"
            lines={C7}
            revealAt={revealAt}
            fontSize={21}
            activeLine={waveActive(waves, at, frame)}
          />
          <TargetTag v5={true} opacity={fade(0.032, 8)} />
        </div>

        {/* 右：终端实录（前四行承接 2.5b 压暗定格，V5 波红字落地） */}
        <TerminalShell
          rows={[
            {
              text: "$ mvn -q compile exec:java -Dexec.mainClass=…SingletonEvolutionDemo",
              kind: "cmd",
              opacity: 0.4,
            },
            { text: "=== 第三幕 · 反射攻击（C7） ===", kind: "out", opacity: 0.4 },
            {
              text: "攻击 V1 饿汉式（普通类）: ghost == getInstance() → false",
              kind: "hot",
              opacity: 0.4,
            },
            { text: "            ← 失守！第二个实例诞生", kind: "hot", opacity: 0.4 },
            {
              text: "攻击 V5 枚举: java.lang.IllegalArgumentException:",
              kind: "hot",
              opacity: fade(0.244),
              link: true,
            },
            {
              text: "            Cannot reflectively create enum objects",
              kind: "hot",
              opacity: fade(0.404),
              link: true,
            },
            { text: "← JVM 在语言层面焊死了这扇门", kind: "out", opacity: fade(0.635) },
          ]}
        />
      </div>

      {/* Exception 定格条：报错原文贴屏（台词念到「报错原文贴在屏幕上」起，定格到镜尾） */}
      <div
        style={{
          marginTop: 16,
          display: "flex",
          alignItems: "center",
          gap: 16,
          border: `2px solid ${theme.danger}`,
          borderRadius: 12,
          padding: "12px 24px",
          backgroundColor: theme.deepBg,
          opacity: fade(0.404, 10),
        }}
      >
        <span style={{ fontSize: 26, color: theme.danger }}>✖</span>
        <span style={{ fontFamily: theme.font.mono, fontSize: 26, fontWeight: 700, color: theme.danger }}>
          Cannot reflectively create enum objects
        </span>
        <span style={{ fontSize: 21, color: theme.textMuted }}>报错原文 · 无法用反射创建枚举对象</span>
      </div>

      {/* 下：徽标墙（V1–V4 承接失守态）＋ 压轴三徽章 */}
      <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
        <BadgeWall arrowOpacity={fade(0.032)} dead={true} smash={0} shield={shield} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginLeft: 24 }}>
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
                opacity: pop(finaleAt[i]),
                backgroundColor: alpha(theme.ok, 0.08),
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
