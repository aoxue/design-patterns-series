import type { FC } from "react";
import { AbsoluteFill } from "remotion";
import { CodeCard, type CodeLine } from "../../components/CodeCard";
import { theme } from "../../theme";
import { useAnchors, type SceneProps, usePalette } from "../../scene-kit";

/**
 * 镜 2.3a · V3 双检锁 DCL 结构段（3:14–3:40，v4 自旧 2.3 拆出）
 * 画面（脚本 v4 拆镜行）：C4 四步依次标号浮现（一查→加锁→二查→创建）。
 * 口诀四 chip 随「一查、加锁、二查、创建」逐个点亮；四步代码行随各自讲解展开，
 * ▶ 游标停在当前讲解中的那一步。volatile 高亮与 A2 重排动画归 2.3b，本镜不碰。
 */

/** C4 · V3 双检锁（与脚本代码卡原文一致） */
const LINES: CodeLine[] = [
  { segs: [{ text: "public class PromoConfigManager {" }] },
  {
    segs: [
      { text: "    private static " },
      { text: "volatile", kind: "danger" },
      { text: " PromoConfigManager " },
      { text: "instance", kind: "kw" },
      { text: ";        // volatile：防指令重排", kind: "comment" },
    ],
  },
  { segs: [{ text: "    private PromoConfigManager() { refresh(); }" }] },
  { segs: [{ text: "    public static PromoConfigManager getInstance() {" }] },
  {
    segs: [
      { text: "        if (instance == null) {                  // " },
      { text: "一查：无锁，挡掉绝大多数", kind: "comment" },
    ],
  },
  {
    segs: [
      { text: "            " },
      { text: "synchronized", kind: "kw" },
      { text: " (PromoConfigManager.class) {   // " },
      { text: "加锁", kind: "comment" },
    ],
  },
  {
    segs: [
      { text: "                if (instance == null) {          // " },
      { text: "二查：拿到锁再确认", kind: "comment" },
    ],
  },
  {
    segs: [
      { text: "                    instance = " },
      { text: "new PromoConfigManager()", kind: "danger" },
      { text: ";      // " },
      { text: "创建", kind: "comment" },
    ],
  },
  { segs: [{ text: "                }" }] },
  { segs: [{ text: "            }" }] },
  { segs: [{ text: "        }" }] },
  { segs: [{ text: "        return instance;" }] },
  { segs: [{ text: "    }" }] },
  { segs: [{ text: "}" }] },
];

/** 口诀 chip 字位锚点（subtitle 142 字）：口诀句内「一查、加锁、二查、创建」四个词位 */
const MOTTO_AT = [0.31, 0.331, 0.352, 0.373];
/** 四步讲解字位锚点：无锁判空 0.437 / 才进 synchronized 0.662 / 再判一次空 0.817 / 前一个线程刚建完 0.93 */
const STEP_AT = [0.437, 0.662, 0.817, 0.93];

export const Scene23aDcl: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { at, fade, seen } = useAnchors(leadFrames, audioFrames);
  const palette = usePalette();

  const motto = ["一查", "加锁", "二查", "创建"];

  // 代码行出现帧：头部 4 行随「第三版，双检锁」先落地；四步行各等自己的讲解；
  // 收尾大括号与 return 在「创建」行之后级联补齐（台词不逐行念到，按 6 帧步进收口，
  // QA 实拍教训：8 帧步进下尾行距镜尾仅 40 余帧、观感偏赶，收紧到 6 帧）
  const tail = at(STEP_AT[3]);
  const revealAt = [
    at(0.02),
    at(0.03),
    at(0.04),
    at(0.05),
    at(STEP_AT[0]),
    at(STEP_AT[1]),
    at(STEP_AT[2]),
    at(STEP_AT[3]),
    tail + 6,
    tail + 12,
    tail + 18,
    tail + 24,
    tail + 30,
    tail + 36,
  ];

  // ▶ 执行游标：落在当前正在讲解的那一步（一查行 4 / 加锁行 5 / 二查行 6 / 创建行 7）
  const activeLine = seen(STEP_AT[3])
    ? 7
    : seen(STEP_AT[2])
      ? 6
      : seen(STEP_AT[1])
        ? 5
        : seen(STEP_AT[0])
          ? 4
          : -1;

  return (
    <AbsoluteFill style={{ padding: "104px 150px 150px" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 22, marginBottom: 24 }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: theme.text }}>
          <span style={{ fontFamily: theme.font.mono, color: palette.primaryBright }}>V3</span> 双检锁 DCL
          <span style={{ fontSize: 22, fontWeight: 400, color: theme.textMuted, marginLeft: 12 }}>
            Double-Checked Locking
          </span>
        </div>
        {/* 口诀四步：随口诀句逐个点亮（C4 四步依次标号浮现） */}
        {motto.map((m, i) => (
          <span
            key={m}
            style={{
              fontSize: 23,
              fontFamily: theme.font.mono,
              color: seen(MOTTO_AT[i]) ? palette.primaryBright : theme.textMuted,
              border: `1px solid ${seen(MOTTO_AT[i]) ? palette.primary : palette.surfaceBorder}`,
              borderRadius: 999,
              padding: "3px 16px",
              opacity: seen(MOTTO_AT[i]) ? 1 : 0.45,
            }}
          >
            {i + 1}. {m}
          </span>
        ))}
      </div>

      {/* C4 代码卡：拆镜后独占主舞台，字号放大居中 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <CodeCard
          title="PromoConfigManager.java · V3 双检锁"
          lines={LINES}
          revealAt={revealAt}
          fontSize={22}
          activeLine={activeLine}
        />
        {/* 台词原文引用条：讲解「一查」时浮现的口播原句，不另造文案 */}
        <div
          style={{
            marginTop: 22,
            fontSize: 23,
            color: theme.textMuted,
            textAlign: "center",
            opacity: fade(STEP_AT[0]),
          }}
        >
          99% 的请求到这里就被打发走了；只有发现实例还没建，才进 synchronized
        </div>
      </div>
    </AbsoluteFill>
  );
};
