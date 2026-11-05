import type { FC } from "react";
import { Fragment } from "react";
import { Composition } from "remotion";
import { Episode, computeTimeline, type TimelineItem } from "./Episode";
import { EPISODES, type EpisodeModule } from "./episodes/registry";

/** 工具合成：把音频实测时间轴通过 calculateMetadata 暴露给脚本（tools/contact-sheet.mjs） */
const TimelineProbe: FC<{ episodeId: string; timeline: TimelineItem[] | null }> = () => null;

/** 探针合成共用：该期时间轴与全片帧数（音频实测，与正片同源） */
const probeMetadata = async (ep: EpisodeModule) => {
  const timeline = await computeTimeline(ep);
  return {
    durationInFrames: Math.max(
      1,
      timeline.reduce((m, it) => Math.max(m, it.startFrame + it.frames), 1)
    ),
    props: { episodeId: ep.id, timeline },
  };
};

/**
 * 根组件：遍历期注册表注册合成，加新期零改码（registry.ts 追加即可）。
 * 每期两个合成：正片 `<EPxx>` + 帧区间探针 `<TimelineProbe-EPxx>`（不参与出片）。
 */
export const RemotionRoot: FC = () => (
  <>
    {EPISODES.map((ep) => (
      <Fragment key={ep.id}>
        <Composition
          id={ep.id}
          component={Episode}
          durationInFrames={18000}
          fps={30}
          width={1920}
          height={1080}
          defaultProps={{ episodeId: ep.id, timeline: null }}
          calculateMetadata={async () => {
            const timeline = await computeTimeline(ep);
            const durationInFrames = timeline.reduce(
              (max, it) => Math.max(max, it.startFrame + it.frames),
              1
            );
            return { durationInFrames, props: { episodeId: ep.id, timeline } };
          }}
        />
        {/* 联系表生成器读取每镜帧区间用；不参与出片 */}
        <Composition
          id={`TimelineProbe-${ep.id}`}
          component={TimelineProbe}
          durationInFrames={1}
          fps={30}
          width={16}
          height={16}
          defaultProps={{ episodeId: ep.id, timeline: null }}
          calculateMetadata={async () => probeMetadata(ep)}
        />
      </Fragment>
    ))}
  </>
);
