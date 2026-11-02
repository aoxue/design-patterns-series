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
        left: 120,
        right: 120,
        display: "flex",
        justifyContent: "center",
        opacity: fadeIn,
      }}
    >
      <div
        style={{
          maxWidth: 1560,
          fontSize: 34,
          lineHeight: 1.5,
          color: theme.text,
          textAlign: "center",
          // 深色底片不垫色块：靠双层阴影保证字幕在任何画面上的可读性
          textShadow:
            "0 2px 6px rgba(0, 0, 0, 0.9), 0 0 24px rgba(0, 0, 0, 0.65)",
        }}
      >
        {chunks[index]}
      </div>
    </div>
  );
};
