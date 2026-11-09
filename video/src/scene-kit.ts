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

/** 词级时间戳（whisper/tts 产物；中文常为单字词，英文/数字为整词） */
export interface TimedWord {
  text: string;
  s: number;
  e: number;
}

/** 一镜的对齐数据：chunks 为字幕原文断句（权威），words 为转写词级时间（可能有同音误差） */
export interface ShotAlign {
  chunks: TimedChunk[];
  words?: TimedWord[];
}

/** Episode 注入的对齐上下文；at(p)/atWord() 据此把台词位置映射到实测时间 */
export const AnchorCtx = createContext<ShotAlign | null>(null);

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
  const align = useContext(AnchorCtx);
  const chunks = align?.chunks ?? null;

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

  /**
   * 关键词 → 实测帧号（v4.1 锚点实测化主力 API）。三级命中：
   * ① 词级精确命中（words 拼串后子串搜索，命中词的 s 即答案）：健康态，不打日志；
   * ② chunk 兜底：字幕原文含关键词 → 在该 chunk 内按字位内插（chunk 仅 2–5s，误差远小于全镜等分）；
   * ③ 无对齐数据（或关键词连 chunk 原文都不含）→ 退回 at(fallback)（调用方传旧字符占比锚点即保底旧行为）。
   * ②③ 属兜底命中 = 潜在漂移点（不随换配音的词位重排）：打 console.warn 审计。
   * 查看法：remotion still / render 需加 --log=verbose 才会把页面 console 转发到终端
   * （默认日志级别会吞掉），动画师写完锚点跑 still --log=verbose，出现警告即该处
   * 未词级命中，按选词纪律换词；Studio 预览（npm run dev）可直接看浏览器控制台。
   * 注意：whisper 转写有同音误差（饿汉→恶焊），关键词优先选字幕原文独有片段；
   * 「不要」这类会被「要不要」包含的短词，加标点（「不要，」）或换长词规避。
   * occ：第几次出现（默认第一次）。
   */
  const atWord = (kw: string, fallback = 0.5, occ = 0): number => {
    const words = align?.words;
    if (words && words.length > 0) {
      const ranges: Array<[number, number]> = [];
      let joined = "";
      for (const w of words) {
        ranges.push([joined.length, joined.length + w.text.length]);
        joined += w.text;
      }
      let from = 0;
      let n = 0;
      for (;;) {
        const hit = joined.indexOf(kw, from);
        if (hit === -1) break;
        if (n === occ) {
          for (let i = 0; i < ranges.length; i++) {
            if (hit >= ranges[i][0] && hit < ranges[i][1]) return leadFrames + words[i].s * fps;
          }
        }
        n++;
        from = hit + 1;
      }
    }
    if (chunks && chunks.length > 0) {
      let n = 0;
      for (const c of chunks) {
        const off = c.text.indexOf(kw);
        if (off >= 0) {
          if (n === occ) {
            const t = c.s + (off / c.text.length) * (c.e - c.s);
            const f = leadFrames + t * fps;
            // 审计：词级未命中（关键词与转写不符或 occ 越界），落 chunk 内插 = 潜在漂移点
            console.warn(
              `[atWord] chunk-fallback «${kw}» occ=${occ} → frame ${Math.round(f)}`
            );
            return f;
          }
          n++;
        }
      }
    }
    const f = at(fallback);
    // 审计：连 chunk 原文都不含该关键词（或全镜无对齐数据），退回占比兜底 = 潜在漂移点
    console.warn(`[atWord] no-align-fallback «${kw}» occ=${occ} → frame ${Math.round(f)}`);
    return f;
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
  /** 以下三个是帧号直挂版（配 atWord 用）：语义同 fade/pop/seen，入参已是帧号 */
  const fadeAt = (f: number, dur = 15) =>
    interpolate(frame, [f, f + dur], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const popAt = (f: number) =>
    spring({ frame: frame - Math.round(f), fps, config: { damping: 13 } });
  const seenAt = (f: number) => frame >= f;
  return { frame, fps, at, atWord, fade, pop, seen, fadeAt, popAt, seenAt };
};
