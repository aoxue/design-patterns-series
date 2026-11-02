import type { FC } from "react";
import { Composition } from "remotion";
import { Episode, computeTimeline, type TimelineItem } from "./Episode";

/** 工具合成：把音频实测时间轴通过 calculateMetadata 暴露给脚本（tools/contact-sheet.mjs） */
const TimelineProbe: FC<{ timeline: TimelineItem[] | null }> = () => null;

/**
 * 根组件：注册合成。
 * durationInFrames 只是兜底值；真实时长由 calculateMetadata 按
 * public/audio/ 里各段音频实测时长计算（音频槽位架构的核心）。
 */
export const RemotionRoot: FC = () => (
  <>
    <Composition
      id="EP01"
      component={Episode}
      durationInFrames={18000}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ timeline: null }}
      calculateMetadata={async () => {
        const timeline = await computeTimeline();
        const durationInFrames = timeline.reduce(
          (max, it) => Math.max(max, it.startFrame + it.frames),
          1
        );
        return { durationInFrames, props: { timeline } };
      }}
    />
    {/* 联系表生成器读取每镜帧区间用；不参与出片 */}
    <Composition
      id="TimelineProbe"
      component={TimelineProbe}
      durationInFrames={1}
      fps={30}
      width={16}
      height={16}
      defaultProps={{ timeline: null }}
      calculateMetadata={async () => {
        const timeline = await computeTimeline();
        return {
          durationInFrames: Math.max(
            1,
            timeline.reduce((m, it) => Math.max(m, it.startFrame + it.frames), 1)
          ),
          props: { timeline },
        };
      }}
    />
  </>
);
