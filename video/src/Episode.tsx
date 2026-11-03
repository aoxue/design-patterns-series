import type { FC } from "react";
import {
  AbsoluteFill,
  Audio,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { getAudioData } from "@remotion/media-utils";
import { SHOTS, FPS, EPISODE, ESTIMATE_CPS, audioPath, splitSubtitles, type ShotData } from "./data";
import { theme } from "./theme";
import { SubtitleBar } from "./components/SubtitleBar";
import { AnchorCtx, type SceneProps, type TimedChunk } from "./scene-kit";
import { HookScene } from "./scenes/HookScene";
import { CrimeScene } from "./scenes/CrimeScene";
import { QuestionScene } from "./scenes/QuestionScene";
import { RoadmapScene } from "./scenes/RoadmapScene";
import { Scene21Eager } from "./scenes/Scene21Eager";
import { Scene22Lazy } from "./scenes/Scene22Lazy";
import { Scene23Dcl } from "./scenes/Scene23Dcl";
import { Scene24Holder } from "./scenes/Scene24Holder";
import { Scene25Enum } from "./scenes/Scene25Enum";
import { Scene31Uml } from "./scenes/Scene31Uml";
import { Scene32Compare } from "./scenes/Scene32Compare";
import { Scene41Intro } from "./scenes/Scene41Intro";
import { Scene42Runtime } from "./scenes/Scene42Runtime";
import { Scene43Spring } from "./scenes/Scene43Spring";
import { Scene51Warnings } from "./scenes/Scene51Warnings";
import { Scene61Outro } from "./scenes/Scene61Outro";
import { Scene62Decision } from "./scenes/Scene62Decision";
import { Scene63Teaser } from "./scenes/Scene63Teaser";

export interface TimelineItem extends ShotData {
  startFrame: number;
  frames: number;
  audioSec: number;
  /** 逐句时间戳（音频是唯一时钟；缺失时字幕/动画退化为等比估算） */
  chunks?: TimedChunk[];
}

/** 由各段音频实测时长（或估算值）铺出整条时间轴 */
export const buildTimeline = (
  durations: number[] | null,
  alignShots: Record<string, TimedChunk[]> = {}
): TimelineItem[] => {
  const items: TimelineItem[] = [];
  let cursor = 0;
  SHOTS.forEach((s, i) => {
    const audioSec = durations ? durations[i] : s.subtitle.length / ESTIMATE_CPS;
    const frames = Math.ceil((s.leadSec + audioSec + s.tailSec) * FPS);
    items.push({ ...s, startFrame: cursor, frames, audioSec, chunks: alignShots[s.id] });
    cursor += frames;
  });
  return items;
};

/** 读取 public/audio/ 实测时长 + 逐句时间戳；音频槽位架构：换音频零改码，时长自动重算 */
export const computeTimeline = async (): Promise<TimelineItem[]> => {
  const durations: number[] = [];
  for (const s of SHOTS) {
    try {
      const d = await getAudioData(staticFile(audioPath(s.audio)));
      durations.push(d.durationInSeconds);
    } catch {
      durations.push(s.subtitle.length / ESTIMATE_CPS);
    }
  }
  // 逐句时间戳（tts.py 生成；真人原声用 whisper 对齐工具重算，见 video/README）
  let alignShots: Record<string, TimedChunk[]> = {};
  try {
    const res = await fetch(staticFile(`audio/${EPISODE}/align.json`));
    if (res.ok) {
      alignShots = ((await res.json()) as { shots?: Record<string, TimedChunk[]> }).shots ?? {};
    }
  } catch {
    // 无对齐文件：字幕/锚点走估算（与旧版行为一致）
  }
  return buildTimeline(durations, alignShots);
};

/** 镜号 → 场景组件（EP01 全片 18 镜；PoC 四镜沿用绝对帧动画，其余走台词进度锚点） */
const SCENES: Record<string, FC<SceneProps>> = {
  "1.1": HookScene,
  "1.2": CrimeScene,
  "1.3": QuestionScene,
  "1.4": RoadmapScene,
  "2.1": Scene21Eager,
  "2.2": Scene22Lazy,
  "2.3": Scene23Dcl,
  "2.4": Scene24Holder,
  "2.5": Scene25Enum,
  "3.1": Scene31Uml,
  "3.2": Scene32Compare,
  "4.1": Scene41Intro,
  "4.2": Scene42Runtime,
  "4.3": Scene43Spring,
  "5.1": Scene51Warnings,
  "6.1": Scene61Outro,
  "6.2": Scene62Decision,
  "6.3": Scene63Teaser,
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const Episode: FC<{ timeline: TimelineItem[] | null }> = ({ timeline }) => {
  const tl = timeline ?? buildTimeline(null);
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const totalFrames = tl.reduce((m, it) => Math.max(m, it.startFrame + it.frames), 1);

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
        backgroundColor: theme.bg,
        fontFamily: theme.font.sans,
        // 全局基础字色：防止未显式写 color 的文字继承浏览器默认黑色（深底黑字不可读）
        color: theme.text,
      }}
    >
      {tl.map((it) => {
        const Scene = SCENES[it.id];
        const leadFrames = Math.round(it.leadSec * FPS);
        return (
          <Sequence key={it.id} from={it.startFrame} durationInFrames={it.frames} name={it.id}>
            <AnchorCtx.Provider value={it.chunks ?? null}>
              {Scene ? (
                <Scene
                  frames={it.frames}
                  leadFrames={leadFrames}
                  audioFrames={Math.ceil(it.audioSec * FPS)}
                />
              ) : null}
              <Sequence from={leadFrames} durationInFrames={Math.ceil(it.audioSec * FPS) + 5}>
                <Audio src={staticFile(audioPath(it.audio))} />
              </Sequence>
            </AnchorCtx.Provider>
          </Sequence>
        );
      })}

      {/* 全局 chrome：系列标识 + 当前镜号 */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 64,
          right: 64,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 22,
          color: theme.textMuted,
          letterSpacing: 2,
        }}
      >
        <span>码上购 · 设计模式 26 讲</span>
        <span style={{ fontFamily: theme.font.mono }}>
          EP01 单例 · {active.id}
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
          backgroundColor: theme.primary,
        }}
      />
      <span style={{ display: "none" }}>{fps}</span>
    </AbsoluteFill>
  );
};
