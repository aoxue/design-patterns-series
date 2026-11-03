import type { FC } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { CodeCard, type CodeLine } from "../components/CodeCard";
import { theme } from "../theme";
import { useAnchors, type SceneProps } from "../scene-kit";

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
      { text: "                              // 私有构造：掐断外部 new", kind: "comment" },
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

// 台词同步锚点（0–1）：三行看门 / 编译报错 / 太急 / 冷启动 / 推向 V2
const STEP = [0.1, 0.17, 0.32, 0.5, 0.72];

export const Scene21Eager: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, at, fade, pop, seen } = useAnchors(leadFrames, audioFrames);

  const revealAt = [
    at(STEP[0] - 0.02),
    at(STEP[0]),
    at(STEP[1]),
    at(STEP[2]),
    at(STEP[2] + 0.01),
  ];

  // 「类一加载实例就建好」：类加载进度条在代码卡成形后跑满，实例弹出
  const loadP = interpolate(frame, [at(0.05), at(STEP[0])], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // 缺点段：冷启动被拖慢的进度条（无人使用也照建）
  const slowP = interpolate(frame, [at(0.66), at(0.78)], [0, 0.35], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.in(Easing.quad),
  });

  const lockShake = seen(STEP[1])
    ? Math.max(0, 1 - (frame - at(STEP[1])) / 12) * Math.sin((frame - at(STEP[1])) / 1.5) * 6
    : 0;

  return (
    <AbsoluteFill style={{ padding: "130px 90px 150px" }}>
      <div style={{ fontSize: 38, fontWeight: 700, color: theme.text, marginBottom: 24 }}>
        <span style={{ fontFamily: theme.font.mono, color: theme.primaryBright }}>V1</span> 饿汉式 ·
        类一加载，实例就建好 <span style={{ fontSize: 26, color: theme.textMuted, fontWeight: 400 }}>—— 饿到等不及</span>
      </div>

      <div style={{ display: "flex", gap: 40, flex: 1 }}>
        {/* 左：C2 代码卡 + 类加载进度条 */}
        <div style={{ flex: 1.25, display: "flex", flexDirection: "column", gap: 20 }}>
          <CodeCard title="PromoConfigManager.java · V1 饿汉式" lines={LINES} revealAt={revealAt} fontSize={21} />
          <div style={{ display: "flex", alignItems: "center", gap: 16, opacity: fade(STEP[0]) }}>
            <span style={{ fontSize: 24, color: theme.textMuted, width: 130 }}>类加载</span>
            <div
              style={{
                flex: 1,
                height: 18,
                borderRadius: 9,
                backgroundColor: "rgba(10, 24, 38, 0.9)",
                border: `1px solid ${theme.surfaceBorder}`,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${loadP * 100}%`,
                  backgroundColor: theme.primary,
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
              backgroundColor: theme.surface,
              border: `1px solid ${theme.surfaceBorder}`,
              borderRadius: 14,
              padding: "20px 26px",
              opacity: fade(STEP[1] - 0.02),
              transform: `translateY(${(1 - fade(STEP[1] - 0.02)) * 20}px)`,
            }}
          >
            <div style={{ fontSize: 24, color: theme.textMuted, marginBottom: 12 }}>
              事故现场的三处 new，现在——
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
                  opacity: fade(STEP[1] + i * 0.02),
                }}
              >
                <span style={{ color: seen(STEP[1] + i * 0.02) ? theme.danger : theme.textMuted }}>✕</span>
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
              backgroundColor: theme.surface,
              border: `1px solid ${theme.warn}`,
              borderRadius: 14,
              padding: "20px 26px",
              opacity: fade(STEP[3]),
              transform: `translateX(${lockShake}px) scale(${0.94 + fade(STEP[3]) * 0.06})`,
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
                backgroundColor: "rgba(10, 24, 38, 0.9)",
                border: `1px solid ${theme.surfaceBorder}`,
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
              backgroundColor: "rgba(59, 130, 246, 0.10)",
              border: `1px solid ${theme.primary}`,
              display: "flex",
              alignItems: "center",
              gap: 18,
              opacity: fade(STEP[4]),
            }}
          >
            <span style={{ fontSize: 26, color: theme.text }}>
              团队需求：<span style={{ color: theme.primaryBright }}>第一次用到再建？</span>
            </span>
            <span
              style={{
                marginLeft: "auto",
                fontSize: 24,
                color: theme.primaryBright,
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
