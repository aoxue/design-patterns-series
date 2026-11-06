import type { FC } from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getAudioData } from "@remotion/media-utils";
import { FPS, ESTIMATE_CPS, audioPath, splitSubtitles, type ShotData } from "./data";
import { getPalette, theme } from "./theme";
import { SubtitleBar } from "./components/SubtitleBar";
import { AnchorCtx, PaletteCtx, type SceneProps, type ShotAlign, type TimedChunk } from "./scene-kit";
import { getEpisode, type EpisodeModule } from "./episodes/registry";

export interface TimelineItem extends ShotData {
  startFrame: number;
  frames: number;
  audioSec: number;
  /** 逐句时间戳（音频是唯一时钟；缺失时字幕/动画退化为等比估算） */
  chunks?: TimedChunk[];
  /** 词级时间戳（atWord 关键词锚点用；缺失时 atWord 退到 chunk 内插） */
  words?: ShotAlign["words"];
}

/** 由各段音频实测时长（或估算值）铺出整条时间轴 */
export const buildTimeline = (
  ep: EpisodeModule,
  durations: number[] | null,
  alignShots: Record<string, ShotAlign> = {}
): TimelineItem[] => {
  const items: TimelineItem[] = [];
  let cursor = 0;
  ep.lines.forEach((s, i) => {
    const audioSec = durations ? durations[i] : s.subtitle.length / ESTIMATE_CPS;
    const frames = Math.ceil((s.leadSec + audioSec + s.tailSec) * FPS);
    items.push({
      ...s,
      startFrame: cursor,
      frames,
      audioSec,
      chunks: alignShots[s.id]?.chunks,
      words: alignShots[s.id]?.words,
    });
    cursor += frames;
  });
  return items;
};

/** 读取 public/audio/ 实测时长 + 逐句时间戳；音频槽位架构：换音频零改码，时长自动重算 */
export const computeTimeline = async (ep: EpisodeModule): Promise<TimelineItem[]> => {
  const durations: number[] = [];
  for (const s of ep.lines) {
    try {
      const d = await getAudioData(staticFile(audioPath(ep, s.audio)));
      durations.push(d.durationInSeconds);
    } catch {
      durations.push(s.subtitle.length / ESTIMATE_CPS);
    }
  }
  // 逐句时间戳（tts.py 生成；真人原声用 whisper 对齐工具重算，见 video/README）
  let alignShots: Record<string, ShotAlign> = {};
  try {
    const res = await fetch(staticFile(audioPath(ep, "align.json")));
    if (res.ok) {
      // align.json 的镜条目形状是 {words, chunks}（tts.py / whisper_align.py 产物，
      // sync-check.mjs 同样按 .chunks 读取）；兼容旧版直出的数组形状，统一归一成
      // {chunks, words} 再下发给字幕与锚点，否则 AnchorCtx 拿到对象会静默退化为估算
      const data = (await res.json()) as {
        shots?: Record<
          string,
          TimedChunk[] | { chunks?: TimedChunk[]; words?: Array<[number, number, string]> }
        >;
      };
      for (const [id, v] of Object.entries(data.shots ?? {})) {
        const list = Array.isArray(v) ? v : v?.chunks;
        if (Array.isArray(list) && list.length > 0) {
          const rawWords = Array.isArray(v) ? undefined : v?.words;
          alignShots[id] = {
            chunks: list,
            words: rawWords?.map(([s, e, text]) => ({ s, e, text })),
          };
        }
      }
    }
  } catch {
    // 无对齐文件：字幕/锚点走估算（与旧版行为一致）
  }
  return buildTimeline(ep, durations, alignShots);
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const Episode: FC<{ episodeId: string; timeline: TimelineItem[] | null }> = ({
  episodeId,
  timeline,
}) => {
  // 期模块由注册表按期号解析：场景映射、期标题、分类色板都从期模块取
  const ep = getEpisode(episodeId);
  const palette = getPalette(ep.category);
  const tl = timeline ?? buildTimeline(ep, null);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = tl.reduce((m, it) => Math.max(m, it.startFrame + it.frames), 1);

  // 笔记卡不经过口播层，避免尾镜字幕、镜号与进度条延续到落幕画面。
  if (ep.notes && frame >= totalFrames) {
    const Notes = ep.notes.component;
    return (
      <Sequence from={totalFrames} durationInFrames={ep.notes.durationInFrames} name="模式笔记">
        <Notes frames={ep.notes.durationInFrames} />
      </Sequence>
    );
  }

  // 当前镜 & 音频内进度（驱动字幕）
  const active = tl.find((it) => frame < it.startFrame + it.frames) ?? tl[tl.length - 1];
  const audioFrames = Math.max(active.audioSec * FPS, 1);
  const progress = clamp(
    (frame - active.startFrame - active.leadSec * FPS) / audioFrames,
    0,
    1
  );

  return (
    <AbsoluteFill
      style={{
        backgroundColor: palette.bg,
        fontFamily: theme.font.sans,
        // 全局基础字色：防止未显式写 color 的文字继承浏览器默认黑色（深底黑字不可读）
        color: theme.text,
      }}
    >
      {ep.bgm ? <Audio src={staticFile(audioPath(ep, ep.bgm))} /> : null}
      <PaletteCtx.Provider value={palette}>
        {tl.map((it) => {
        const Scene = ep.scenes[it.id];
        const leadFrames = Math.round(it.leadSec * FPS);
        return (
          <Sequence key={it.id} from={it.startFrame} durationInFrames={it.frames} name={it.id}>
            <AnchorCtx.Provider value={it.chunks ? { chunks: it.chunks, words: it.words } : null}>
              {Scene ? (
                <Scene
                  frames={it.frames}
                  leadFrames={leadFrames}
                  audioFrames={Math.ceil(it.audioSec * FPS)}
                />
              ) : null}
              <Sequence from={leadFrames} durationInFrames={Math.ceil(it.audioSec * FPS) + 5}>
                <Audio src={staticFile(audioPath(ep, it.audio))} />
              </Sequence>
            </AnchorCtx.Provider>
          </Sequence>
        );
      })}
      </PaletteCtx.Provider>

      {/* 全局 chrome：系列标识 + 当前镜号 */}
      <div
        style={{
          position: "absolute",
          top: 28,
          left: 64,
          right: 64,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 22,
          color: theme.textMuted,
          letterSpacing: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {/* 浅底托住黑白标志，保证各分类深色背景上的完整轮廓可见。 */}
          <div
            style={{
              width: 56,
              height: 56,
              padding: 4,
              boxSizing: "border-box",
              borderRadius: 12,
              backgroundColor: theme.text,
            }}
          >
            <Img
              src={staticFile("brand/mashanggou-logo.png")}
              alt="码上购 Logo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
          <span>码上购 · 设计模式 26 讲</span>
        </div>
        <span style={{ fontFamily: theme.font.mono }}>
          {/* 拼成单一文本节点：多个 JSX 子表达式会在文本节点边界打断字符整形（kerning），观感与旧版有细差 */}
          {`${ep.id} ${ep.title} · ${active.id}`}
        </span>
      </div>

      <SubtitleBar
        chunks={splitSubtitles(active.subtitle)}
        progress={progress}
        timed={active.chunks}
        tAudio={clamp((frame - active.startFrame - active.leadSec * FPS) / FPS, 0, active.audioSec)}
      />

      {/* 全片进度条 */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 5,
          width: `${(frame / totalFrames) * 100}%`,
          backgroundColor: palette.primary,
        }}
      />
      <span style={{ display: "none" }}>{fps}</span>
    </AbsoluteFill>
  );
};
