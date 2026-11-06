import type { FC } from "react";
import { AbsoluteFill, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../../theme";
import type { SceneProps } from "../../scene-kit";
import { QuoteFrame } from "../../components/QuoteFrame";

/**
 * 镜 6.1 · 金句定格（结尾三镜之首）
 * 全片记忆点 + 封面备选帧：主句弹入后整镜定格不再让位。
 * v4.1 黑屏治理：金句从第 0 帧弹入（原 pop(0.02) 等台词 ≈1.3s 才起，
 * leadSec 0.5s + 句首空白期整镜近黑），弹入动作本身即开场画面。
 * 副句「穿之前想清楚」不进画面（与底部字幕条同句会视觉重复），由字幕条承载。
 */
export const Scene61Outro: FC<SceneProps> = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const popIn = spring({ frame, fps, config: { damping: 13 } });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.deepBg, justifyContent: "center", alignItems: "center" }}>
      <QuoteFrame opacity={popIn} scale={1} />
    </AbsoluteFill>
  );
};
