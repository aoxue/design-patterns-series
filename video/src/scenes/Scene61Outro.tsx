import type { FC } from "react";
import { AbsoluteFill } from "remotion";
import { theme } from "../theme";
import { useAnchors, type SceneProps } from "../scene-kit";
import { QuoteFrame } from "../components/QuoteFrame";

/**
 * 镜 6.1 · 金句定格（结尾三镜之首）
 * 全片记忆点 + 封面备选帧：主句弹入后整镜定格不再让位。
 * 副句「穿之前想清楚」不进画面（与底部字幕条同句会视觉重复），由字幕条承载。
 */
export const Scene61Outro: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { pop } = useAnchors(leadFrames, audioFrames);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.deepBg, justifyContent: "center", alignItems: "center" }}>
      <QuoteFrame opacity={pop(0.02)} scale={1} />
    </AbsoluteFill>
  );
};
