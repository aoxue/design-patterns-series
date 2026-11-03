import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { createContext, useContext } from "react";
import type { CategoryPalette } from "./theme";

/**
 * 场景组件统一 props：由调度器按音频实测时长传入。
 * 动画锚点用台词进度比例（0–1）定义；有逐句时间戳（align.json）时自动走真实时间轴。
 */
export interface SceneProps {
  /** 本镜总帧数（lead + audio + tail） */
  frames: number;
  /** 开头留白帧数 */
  leadFrames: number;
  /** 音频实测帧数 */
  audioFrames: number;
}

/** 逐句时间戳（秒，相对本镜音频起点）；来源 public/audio/<EP>/align.json */
export interface TimedChunk {
  text: string;
  s: number;
  e: number;
}

/** Episode 注入的对齐上下文；at(p) 据此把「字符占比」映射到实测时间 */
export const AnchorCtx = createContext<TimedChunk[] | null>(null);

/** Episode 按期注入的分类色板（bg/surface/primary 等 8 个 token；中性色仍走 theme） */
export const PaletteCtx = createContext<CategoryPalette | null>(null);

/** 取本期分类色板；Provider 缺失即渲染树接线错误，抛出而非静默回退（避免整片用错色系） */
export const usePalette = (): CategoryPalette => {
  const palette = useContext(PaletteCtx);
  if (!palette) throw new Error("PaletteCtx 缺失：色板由 Episode 注入，场景必须在 Episode 渲染树内使用");
  return palette;
};

/** 台词进度 → 帧号的映射工具（每个新场景组件开头取一份） */
export const useAnchors = (leadFrames: number, audioFrames: number) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const chunks = useContext(AnchorCtx);

  /**
   * 台词进度 p（0–1，全字幕字符占比）对应的帧号。
   * 有逐句时间戳：按 chunk 累计字符走到目标位置，句内按占比内插 → 与语音逐句锁死；
   * 无时间戳（音频缺失/未对齐）：退化为等比估算（旧行为）。
   */
  const at = (p: number) => {
    if (chunks && chunks.length > 0) {
      const lens = chunks.map((c) => c.text.length);
      const total = lens.reduce((a, b) => a + b, 0);
      if (total > 0) {
        const target = Math.max(0, Math.min(p, 1)) * total;
        let acc = 0;
        for (let i = 0; i < chunks.length; i++) {
          if (target <= acc + lens[i]) {
            const frac = (target - acc) / lens[i];
            const t = chunks[i].s + frac * (chunks[i].e - chunks[i].s);
            return leadFrames + t * fps;
          }
          acc += lens[i];
        }
        return leadFrames + chunks[chunks.length - 1].e * fps;
      }
    }
    return leadFrames + p * audioFrames;
  };

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
