import type { FC } from "react";
import { AbsoluteFill, interpolate } from "remotion";
import { alpha, theme } from "../../theme";
import { useAnchors, type SceneProps, usePalette } from "../../scene-kit";

/**
 * 镜 6.2 · 决策树速记（结尾三镜之二）
 * 三行分支卡随台词逐条弹入（v4.1 实测词位：Spring 项目 ≈3.3 / 裸 Java 5.4 /
 * 要防反射 7.9s，原字符位锚点最多晚 4.5s）；台词新句「这三条存好」≈10.6s 起
 * 三行整体微光一次（价值落点提示，强度压低不抢金句风头）。
 */
export const Scene62Decision: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, atWord, fadeAt, popAt } = useAnchors(leadFrames, audioFrames);
  const palette = usePalette();

  const tree = [
    { q: "Spring 项目", a: "注解 + 注入", kw: "项目", fb: 0.27 },
    { q: "裸 Java", a: "静态内部类起步", kw: "裸", fb: 0.53 },
    { q: "要防反射 / 序列化", a: "枚举封顶", kw: "要防反射", fb: 0.77 },
  ].map((t) => ({ ...t, f: atWord(t.kw, t.fb) }));

  // 「这三条存好」：三行同时轻微增亮一次（颜色/光晕层面，无几何变化）
  const glowF = atWord("这三条存好", 0.88);
  const g = interpolate(frame, [glowF, glowF + 14, glowF + 34], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.deepBg, justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <div style={{ fontSize: 30, color: theme.textMuted, marginBottom: 8, opacity: fadeAt(2, 14) }}>
          真到了要写的那天 · 三秒走完
        </div>
        {tree.map((t) => (
          <div
            key={t.q}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 26,
              backgroundColor: palette.surface,
              border: `1px solid ${g > 0.02 ? palette.primary : palette.surfaceBorder}`,
              borderRadius: 14,
              padding: "20px 40px",
              width: 780, // 三行统一卡宽，避免内容长短导致的参差
              opacity: popAt(t.f),
              transform: `translateX(${(1 - popAt(t.f)) * -40}px)`,
              boxShadow: `0 0 ${26 * g}px ${alpha(palette.primary, 0.22 * g)}`,
            }}
          >
            <span style={{ fontSize: 32, color: theme.text, width: 380 }}>{t.q}</span>
            <span style={{ fontSize: 30, color: theme.textMuted }}>→</span>
            <span style={{ fontSize: 32, color: palette.primaryBright, fontWeight: 700 }}>{t.a}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
