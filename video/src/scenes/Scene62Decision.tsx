import type { FC } from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";
import { useAnchors, type SceneProps } from "../scene-kit";

/**
 * 镜 6.2 · 决策树速记（结尾三镜之二）
 * 三行分支卡随台词逐条弹入，锚点为各分支关键词在台词中的字符位（Spring 0.27 / 裸 Java 0.53 / 要防反射 0.77，
 * 经 align.json 落到实测时间轴），念到哪条亮哪条；整镜居中，不再与金句、预告同屏挤占。
 */
export const Scene62Decision: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { fade, pop } = useAnchors(leadFrames, audioFrames);

  const tree = [
    { q: "Spring 项目", a: "注解 + 注入", p: 0.27 },
    { q: "裸 Java", a: "静态内部类起步", p: 0.53 },
    { q: "要防反射 / 序列化", a: "枚举封顶", p: 0.77 },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: theme.deepBg, justifyContent: "center", alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <div style={{ fontSize: 30, color: theme.textMuted, marginBottom: 8, opacity: fade(0.04) }}>
          真到了要写的那天 · 三秒走完
        </div>
        {tree.map((t) => (
          <div
            key={t.q}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 26,
              backgroundColor: theme.surface,
              border: `1px solid ${theme.surfaceBorder}`,
              borderRadius: 14,
              padding: "20px 40px",
              width: 780, // 三行统一卡宽，避免内容长短导致的参差
              opacity: pop(t.p),
              transform: `translateX(${(1 - pop(t.p)) * -40}px)`,
            }}
          >
            <span style={{ fontSize: 32, color: theme.text, width: 380 }}>{t.q}</span>
            <span style={{ fontSize: 30, color: theme.textMuted }}>→</span>
            <span style={{ fontSize: 32, color: theme.primaryBright, fontWeight: 700 }}>{t.a}</span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
