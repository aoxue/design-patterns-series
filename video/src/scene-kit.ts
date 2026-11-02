import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * 场景组件统一 props：由调度器按音频实测时长传入。
 * 动画锚点用台词进度比例（0–1）定义，TTS 样片换真声后自动适配，无需改码。
 */
export interface SceneProps {
  /** 本镜总帧数（lead + audio + tail） */
  frames: number;
  /** 开头留白帧数 */
  leadFrames: number;
  /** 音频实测帧数 */
  audioFrames: number;
}

/** 台词进度 → 帧号的映射工具（每个新场景组件开头取一份） */
export const useAnchors = (leadFrames: number, audioFrames: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  /** 台词进度 p（0–1）对应的帧号 */
  const at = (p: number) => leadFrames + p * audioFrames;
  /** 进度 p 处淡入（约 0.5 秒） */
  const fade = (p: number, dur = 15) =>
    interpolate(frame, [at(p), at(p) + dur], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  /** 进度 p 处弹入（spring，用于卡片/徽标） */
  const pop = (p: number) =>
    spring({ frame: frame - Math.round(at(p)), fps, config: { damping: 13 } });
  /** 进度 p 起是否已过（用于逐行显隐等布尔开关） */
  const seen = (p: number) => frame >= at(p);
  return { frame, fps, at, fade, pop, seen };
};
