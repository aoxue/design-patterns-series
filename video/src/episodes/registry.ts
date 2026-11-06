import type { FC } from "react";
import type { SceneProps } from "../scene-kit";
import type { ShotData } from "../data";
import type { Category } from "../theme";
import * as EP01 from "./EP01";

/**
 * 一期视频的完整注册信息：加新期 = 在 src/episodes/ 建同名模块（导出
 * id/title/category/lines/scenes 五样）并 import 进 EPISODES 数组，其余零改码。
 */
export interface EpisodeModule {
  /** 期号，同时用作 Composition id 与音频/台词目录名 */
  id: string;
  /** 期标题（顶部 chrome 显示） */
  title: string;
  /** GoF 分类，决定本期色板（PALETTES 的键）；EP00/EP24 等非正片期用 special */
  category: Category;
  /** 台词（来自 public/episodes/EPxx.json），时间轴由它铺出 */
  lines: ShotData[];
  /** 镜号 → 场景组件 */
  scenes: Record<string, FC<SceneProps>>;
  /** 口播结束后追加的无声笔记卡；独立阅读时长，不参与字幕与音频时间轴。 */
  notes?: { component: FC<{ frames: number }>; durationInFrames: number };
}

/** 期注册表：静态 import，逐期追加 */
export const EPISODES: EpisodeModule[] = [EP01];

/** 按期号取期模块；注册表里没有视为工程错误，直接抛出 */
export const getEpisode = (id: string): EpisodeModule => {
  const ep = EPISODES.find((e) => e.id === id);
  if (!ep) throw new Error(`未知期号 ${id}（检查 src/episodes/registry.ts）`);
  return ep;
};
