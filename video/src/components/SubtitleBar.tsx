import type { FC } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";

interface SubtitleBarProps {
  chunks: string[];
  /** 0–1，当前镜音频播放进度，按字数权重分摊到各字幕条 */
  progress: number;
}

/** 底部字幕条：整段台词按字数比例映射到音频时间轴，实现音画同步 */
export const SubtitleBar: FC<SubtitleBarProps> = ({ chunks, progress }) => {
  const frame = useCurrentFrame();

  const weights = chunks.map((c) => Math.max(c.length, 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  let index = chunks.length - 1;
  for (let i = 0; i < chunks.length; i++) {
    acc += weights[i];
    if (progress <= acc / total) {
      index = i;
      break;
    }
  }

  const fadeIn = interpolate(frame, [0, 3], [0, 1], {
    extrapolateRight: "clamp",
  });

  if (chunks.length === 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        bottom: 56,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity: fadeIn,
      }}
    >
      <div
        style={{
          maxWidth: 1560,
          padding: "14px 36px",
          borderRadius: 999,
          backgroundColor: "rgba(4, 10, 18, 0.78)",
          border: `1px solid rgba(255, 255, 255, 0.10)`,
          fontSize: 34,
          lineHeight: 1.5,
          color: theme.text,
          textAlign: "center",
        }}
      >
        {chunks[index]}
      </div>
    </div>
  );
};
