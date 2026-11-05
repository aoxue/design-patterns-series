import type { FC } from "react";
import EP01_LINES from "../../public/episodes/EP01.json";
import type { SceneProps } from "../scene-kit";
import type { ShotData } from "../data";
import { IntroScene } from "../scenes/ep01/IntroScene";
import { HookScene } from "../scenes/ep01/HookScene";
import { CrimeScene } from "../scenes/ep01/CrimeScene";
import { QuestionScene } from "../scenes/ep01/QuestionScene";
import { RoadmapScene } from "../scenes/ep01/RoadmapScene";
import { Scene21Eager } from "../scenes/ep01/Scene21Eager";
import { Scene22Lazy } from "../scenes/ep01/Scene22Lazy";
import { Scene23aDcl } from "../scenes/ep01/Scene23aDcl";
import { Scene23bReorder } from "../scenes/ep01/Scene23bReorder";
import { Scene24Holder } from "../scenes/ep01/Scene24Holder";
import { Scene25aEnum, Scene25bAttack, Scene25cShield } from "../scenes/ep01/Scene25Enum";
import { Scene31Uml } from "../scenes/ep01/Scene31Uml";
import { Scene32Compare } from "../scenes/ep01/Scene32Compare";
import { Scene41Intro } from "../scenes/ep01/Scene41Intro";
import { Scene42Runtime } from "../scenes/ep01/Scene42Runtime";
import { Scene43Spring } from "../scenes/ep01/Scene43Spring";
import { Scene51aGlobal, Scene51bState, Scene51cTest } from "../scenes/ep01/Scene51Warnings";
import { Scene61Outro } from "../scenes/ep01/Scene61Outro";
import { Scene62Decision } from "../scenes/ep01/Scene62Decision";
import { Scene63Teaser } from "../scenes/ep01/Scene63Teaser";

/** 期号（= 合成 id，也是 public/audio/、public/episodes/ 的目录/文件名前缀） */
export const id = "EP01";
/** 期标题（顶部 chrome 右侧「EP01 单例 · 镜号」取此处） */
export const title = "单例";
/** GoF 分类（创建型/结构型/行为型），后续期据此切色系 */
export const category = "creational";

/** 台词制作副本（public/episodes/EP01.json）→ ShotData[]；内容事实源是 scripts/ 分镜脚本 */
export const lines: ShotData[] = EP01_LINES.map((l) => ({
  id: l.id,
  audio: l.file,
  leadSec: l.leadSec,
  tailSec: l.tailSec,
  subtitle: l.subtitle,
}));

/** 镜号 → 场景组件（EP01 全片 24 镜含 0.1 引导；v4 拆镜 2.3→2.3a/b、2.5→2.5a/b/c、5.1→5.1a/b/c；
 *  2.5/5.1 族三镜各共用一个族文件，PoC 四镜沿用绝对帧动画，其余走台词进度锚点） */
export const scenes: Record<string, FC<SceneProps>> = {
  "0.1": IntroScene,
  "1.1": HookScene,
  "1.2": CrimeScene,
  "1.3": QuestionScene,
  "1.4": RoadmapScene,
  "2.1": Scene21Eager,
  "2.2": Scene22Lazy,
  "2.3a": Scene23aDcl,
  "2.3b": Scene23bReorder,
  "2.4": Scene24Holder,
  "2.5a": Scene25aEnum,
  "2.5b": Scene25bAttack,
  "2.5c": Scene25cShield,
  "3.1": Scene31Uml,
  "3.2": Scene32Compare,
  "4.1": Scene41Intro,
  "4.2": Scene42Runtime,
  "4.3": Scene43Spring,
  "5.1a": Scene51aGlobal,
  "5.1b": Scene51bState,
  "5.1c": Scene51cTest,
  "6.1": Scene61Outro,
  "6.2": Scene62Decision,
  "6.3": Scene63Teaser,
};
