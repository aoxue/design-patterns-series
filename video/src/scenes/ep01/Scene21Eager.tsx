import type { FC } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { CodeCard, type CodeLine } from "../../components/CodeCard";
import { alpha, theme } from "../../theme";
import { useAnchors, type SceneProps, usePalette } from "../../scene-kit";

/**
 * 镜 2.1 · V1 饿汉式（1:30–2:10）
 * C2 逐行显形 → private 构造器上锁、三处 new 变编译错误 → 「太急」缺点 → 引出 V2
 */
const LINES: CodeLine[] = [
  { segs: [{ text: "public class PromoConfigManager {" }] },
  {
    segs: [
      { text: "    private static final " },
      { text: "PromoConfigManager INSTANCE", kind: "kw" },
      { text: " = " },
      { text: "new PromoConfigManager()", kind: "danger" },
      { text: ";" },
    ],
  },
  {
    segs: [
      { text: "    " },
      { text: "private PromoConfigManager()", kind: "kw" },
      { text: " { refresh(); }" },
      { text: " // 私有构造：掐断外部 new", kind: "comment" },
    ],
  },
  {
    segs: [
      { text: "    public static PromoConfigManager " },
      { text: "getInstance", kind: "kw" },
      { text: "() { return INSTANCE; }" },
    ],
  },
  { segs: [{ text: "}" }] },
];

export const Scene21Eager: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, atWord, fadeAt, popAt, seenAt } = useAnchors(leadFrames, audioFrames);
  const palette = usePalette();

  // v4.1 实测锚点：类落地 0s / INSTANCE 2.2s / 构造器 10s / getInstance 16.7s /
  // 编译报错 13.9s / 太急 23.4s / 冷启动连库 31.1s / 团队提需求 35.1s（原 0.72 字位早出 5.8s）
  const firstF = atWord("第一版", 0.02);
  const loadF = atWord("类一加载", 0.08);
  const ctorF = atWord("构造器", 0.32);
  const getterF = atWord("getInstance", 0.62);
  const errF = atWord("编译报错", 0.3);
  const tooFastF = atWord("太急", 0.5);
  const dbF = atWord("连库", 0.66);
  const teamF = atWord("团队就会提需求", 0.9);

  const revealAt = [
    firstF + 6,
    loadF,
    ctorF,
    getterF,
    getterF + 10,
  ];

  // 「类一加载实例就建好」：类加载进度条在代码卡成形后跑满，实例弹出
  const loadP = interpolate(frame, [firstF, loadF + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 缺点段：冷启动被拖慢的进度条（无人使用也照建），「连库」起蠕行到「团队提需求」
  const slowP = interpolate(frame, [dbF, teamF], [0, 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });

  const lockShake = seenAt(ctorF)
    ? Math.max(0, 1 - (frame - atWord("掐死", 0.36)) / 12) * Math.sin((frame - atWord("掐死", 0.36)) / 1.5) * 6
    : 0;

  return (
    <AbsoluteFill style={{ padding: "130px 90px 150px" }}>
      <div style={{ fontSize: 38, fontWeight: 700, color: theme.text, marginBottom: 24 }}>
        <span style={{ fontFamily: theme.font.mono, color: palette.primaryBright }}>V1</span> 饿汉式 ·
        类一加载，实例就建好 <span style={{ fontSize: 26, color: theme.textMuted, fontWeight: 400 }}>· 饿到等不及</span>
      </div>

      <div style={{ display: "flex", gap: 40, flex: 1 }}>
        {/* 左：C2 代码卡 + 类加载进度条 */}
        <div style={{ flex: 1.25, display: "flex", flexDirection: "column", gap: 20 }}>
          <CodeCard title="PromoConfigManager.java · V1 饿汉式" lines={LINES} revealAt={revealAt} fontSize={21} />
          <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: fadeAt(loadF) }}>
            <span style={{ fontSize: 24, color: theme.textMuted, width: 130 }}>类加载</span>
            <div
              style={{
                flex: 1,
                height: 18,
                borderRadius: 9,
                backgroundColor: alpha(palette.bg, 0.9),
                border: `1px solid ${palette.surfaceBorder}`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${loadP * 100}%`,
                  backgroundColor: palette.primary,
                  borderRadius: 9,
                }}
              />
            </div>
            <span
              style={{
                fontSize: 24,
                fontFamily: theme.font.mono,
                color: loadP >= 1 ? theme.warn : theme.textMuted,
                opacity: loadP >= 1 ? 1 : 0.4,
              }}
            >
              {loadP >= 1 ? "实例已弹出 ✓" : `${Math.round(loadP * 100)}%`}
            </span>
          </div>
        </div>

        {/* 右：三处 new → 编译错误 / 太急缺点 / V2 预告 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              backgroundColor: palette.surface,
              border: `1px solid ${palette.surfaceBorder}`,
              borderRadius: 14,
              padding: "20px 26px",
              opacity: fadeAt(errF),
              transform: `translateY(${(1 - fadeAt(errF)) * 20}px)`,
            }}
          >
            <div style={{ fontSize: 24, color: theme.textMuted, marginBottom: 12 }}>
              事故现场的三处 new，现在：
            </div>
            {["OrderService", "PaymentService", "ReportJob"].map((f, i) => (
              <div
                key={f}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontFamily: theme.font.mono,
                  fontSize: 22,
                  color: theme.text,
                  padding: "6px 0",
                  whiteSpace: "nowrap",
                  opacity: fadeAt(errF + i * 6),
                }}
              >
                <span style={{ color: seenAt(errF + i * 6) ? theme.danger : theme.textMuted }}>✕</span>
                {f}
                <span
                  style={{
                    color: theme.danger,
                    fontSize: 18,
                    marginLeft: "auto",
                    border: `1px solid ${theme.danger}`,
                    borderRadius: 8,
                    padding: "1px 10px",
                  }}
                >
                  编译错误
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              backgroundColor: palette.surface,
              border: `1px solid ${theme.warn}`,
              borderRadius: 14,
              padding: "20px 26px",
              opacity: fadeAt(tooFastF),
              transform: `translateX(${lockShake}px) scale(${0.94 + fadeAt(tooFastF) * 0.06})`,
            }}
          >
            <div style={{ fontSize: 26, fontWeight: 700, color: theme.warn, marginBottom: 10 }}>
              ⚠ 缺点：太急
            </div>
            <div style={{ fontSize: 23, color: theme.text, lineHeight: 1.6 }}>
              没人查促销，实例也照建；要连库、拉远程配置 → 冷启动被拖慢
            </div>
            {/* 冷启动拖慢进度条：卡在 35% 蠕行 */}
            <div
              style={{
                marginTop: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: alpha(palette.bg, 0.9),
                border: `1px solid ${palette.surfaceBorder}`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${slowP * 100}%`,
                  backgroundColor: theme.warn,
                }}
              />
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              padding: "18px 26px",
              backgroundColor: alpha(palette.primary, 0.10),
              border: `1px solid ${palette.primary}`,
              display: "flex",
              alignItems: "center",
              gap: 18,
              opacity: fadeAt(teamF),
            }}
          >
            <span style={{ fontSize: 26, color: theme.text }}>
              团队需求：<span style={{ color: palette.primaryBright }}>第一次用到再建？</span>
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 24,
                color: palette.primaryBright,
                fontFamily: theme.font.mono,
              }}
            >
              → V2 懒汉式
            </span>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
