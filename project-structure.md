# 项目结构导览

> 仓库地图：各目录与关键文件干什么用，给新协作者（人类或 AI）快速定位。只描述**结构与职责**，不承载状态与排期（那是 [README §4](README.md) 的事），各域细则以链接指向的正典文档为准，本文件不复制它们的内容。
>
> 阅读顺序建议：先 [README.md](README.md) 了解项目是什么，再回到本图按需下钻。

## 仓库总览

```
design-patterns-series/
├── README.md                 战略层：项目定位、排期看板（排期与粗状态的唯一事实源）、里程碑门
├── AGENTS.md                 项目规则正典：文档地图、单期流水线、状态纪律、git 约定（AI 与人类协作者都读）
├── production-sop.md         流程层：单期制作流水线定义，六段结构 = 内容标准，§6 DoD、§7 质量门
├── episodes-tier1.md         内容层：T1 梯队（最优先制作的一批期）逐期详案，写脚本前必读对应期
├── operations.md             运营层：周循环节拍、虚拟团队分工与 WIP、发布后数据回填、go/no-go
├── CONTRIBUTING.md           人类开发者参与指南：环境、本地跑通、任务认领
├── project-structure.md      本文件
├── LICENSE                   代码许可证
├── LICENSE-CONTENT.md        视频脚本与文案等内容资产的许可证（与代码分开授权）
│
├── scripts/                  每期分镜脚本：内容唯一事实源（台词/画面/代码切分都在这定稿）
│   ├── EPxx-*.md             分镜脚本：六段分镜 + 代码卡/动画板 + 附录 A–E；附录 D = 该期细粒度进度
│   └── EPxx-*.puml           该期类图（PlantUML），与脚本同目录，创建型蓝/结构型绿/行为型橙
│
├── mashanggou/               「码上购」Java 17 Maven 示例工程：每期演示代码 + 存档
│   └── src/main/java/com/mashanggou/
│       └── promo/            EP01 单例：PromoConfigManagerV0–V5 五版演进 + SingletonEvolutionDemo 演示入口
│                             （每期新增业务线子包：order / payment / report / notify）
│
├── assets/covers/            封面资产：cover-template.html（三色系模板）+ 各期成品封面 PNG
│
├── tools/
│   └── sync-agents.py        把 .agents/ 正典同步到各 AI 工具的运行时目录（ZCode/Claude Code/Codex）
│
├── .agents/                  虚拟团队七角色 subagent 定义正典（编导/审稿人/代码工程师/配音师/动画师/质检员/运营）
│                             只在这里改；.zcode/ .claude/ .codex/ 是各工具的本机运行副本，不进仓库
│
└── video/                    Remotion 成片引擎（独立 npm 工程，见下方专节）
```

## video/ · 成片渲染工程

台词 JSON + 音频槽位 → React 场景组件 → MP4，全程代码不开剪辑软件。细则见 [video/README.md](video/README.md)，此处只给结构索引。

```
video/
├── README.md                 本工程正典：架构（音频槽位核心机制）、命令清单、qwen TTS 坑清单、Agent 工作纪律
├── package.json              npm scripts：lint:colors / lint:subs / sheet / synccheck / dev / render / still
├── remotion.config.ts        Remotion 配置
│
├── src/
│   ├── index.ts              Remotion 入口
│   ├── Root.tsx              Composition 注册根
│   ├── Episode.tsx           通用调度器：按期查注册表铺时间轴 + 全局字幕条 + 注入色板
│   ├── data.ts               纯函数层：字幕切分（与 tts.py / sync-check.mjs 三处实现必须逐条一致）、时间轴计算
│   ├── scene-kit.ts          场景工具：SceneProps / useAnchors（台词进度锚点）/ usePalette
│   ├── theme.ts              色彩体系唯一取色处：中性 token + 四套分类色板，组件禁止硬编码颜色
│   ├── components/           复用件：SubtitleBar（音画同步字幕）、CodeCard（代码卡，diff 删红增绿）、ChapterMark、QuoteFrame
│   ├── episodes/
│   │   ├── registry.ts       期注册表：加新期 = 新建 EPxx.tsx + import 进数组，其余零改码
│   │   └── EP01.tsx          期模块五样：id / title / category / lines / scenes（+ notes 笔记卡 + bgm）
│   └── scenes/epXX/          场景组件，按期分目录，一镜一组件（EP01：24 镜 20 文件）
│
├── public/
│   ├── episodes/
│   │   ├── EPxx.json         台词制作副本（tts 读音稿 + subtitle 字幕 + leadSec/tailSec）；内容事实源在 scripts/
│   │   ├── EPxx.segs.json    配音段定义（≤470 字/段 + 表演指令壳），qwen 终配的输入
│   │   └── EPxx.bgm.json     该期混音配置：素材路径 + 循环窗口 + quietShots 压低镜号
│   ├── audio/EPxx/           音频槽位（进 git）：镜号.mp3 = 人声轨（qwen 终配即发布音轨）
│   │                         align.json = 逐句时间戳（唯一时钟）；bgm.mp3 = 独立音乐轨（不含人声）
│   └── brand/mashanggou-logo.png   系列 Logo（根 README 与视频共用，替换保路径）
│
├── assets/                   进 git 的原料资产
│   ├── bgm/                  BGM 素材库：系列级底乐不带期号（lofi-series-a.mp3，a/b/… 留给变奏），只增不改不覆盖
│   └── voice/voiceprint.wav  全系列统一声纹参考，不可再生资产，只增不改不覆盖
│
├── tools/                    配音 / 混音 / QA 工具链（命令与用途见 video/README.md「命令」节）
│   ├── tts.py                按期生成 edge-tts 样片配音和 align.json
│   ├── tts_qwen.py           qwen 声纹终配（定稿后一次，同名覆盖样片轨即终版发布音轨）
│   ├── whisper_align.py      whisper 重算 align.json（qwen 配音统一走此路）
│   ├── mix_episode_bgm.py    按 EPxx.bgm.json 生成各期独立音乐轨 / 配乐成片
│   ├── test-subtitles.mjs    回归：字幕切分三处实现逐条一致（node --test）
│   ├── test_mix_episode_bgm.py  回归：混音脚本跨期复用（改 mix_episode_bgm.py 后必跑）
│   ├── check-colors.mjs      颜色纪律检查（npm run lint:colors，提交前必跑）
│   ├── check-subtitles.mjs   字幕文本规范检查（npm run lint:subs）
│   ├── contact-sheet.mjs     成片自查联系表，每镜首/中/尾 3 帧
│   ├── sync-check.mjs        音画同步对照，每镜 4 帧 + 字幕配对表
│   ├── record_script.py      留档：导演录音稿导出（备查）
│   └── __pycache__/          不进 git
│
├── node_modules/             不进 git
└── out/                      渲染产物与 QA 中间物（成片、联系表、probe），不进 git
```

## 新人最容易问的五个问题

**1. 改台词到底改哪个文件？**
事实源链：`scripts/EPxx-*.md`（内容唯一事实源，定稿经审稿人 + 导演终审）→ 定稿后同步到 `video/public/episodes/EPxx.json`（制作副本）。改 JSON 不改脚本 = 白改；qwen 已终配后再改词会触发 [SOP §4.4 返工链](production-sop.md)（重配 + 重对齐 + 重渲）。

**2. 视频的背景音乐从哪来？**
三段链路：`video/assets/bgm/`（素材，系列级命名）→ `EPxx.bgm.json`（该期循环窗口与压低配置）→ `mix_episode_bgm.py` 产出 `public/audio/EPxx/bgm.mp3`（成品轨，渲染时与人声各自挂载）。变更配音或时长后须重建音乐轨。

**3. 哪些东西进 git，哪些不进？**
进：台词与配置 JSON、人声 mp3 与 align.json 与 bgm.mp3（`public/audio/EPxx/`）、BGM 素材、声纹、Logo、封面。不进：`video/out/`（成片与 QA 中间物）、`node_modules/`、各 AI 工具的 agents 运行时副本目录。

**4. 根目录 tools/ 和 video/tools/ 什么关系？**
不相干的两回事：根 `tools/sync-agents.py` 管虚拟团队定义在各 AI 工具间的同步；`video/tools/` 是配音、混音、QA 的制作工具链。

**5. 单期进度去哪看？**
两级状态纪律：排期与粗状态只看 `README.md` §4 看板；单集细粒度进度只看该期 `scripts/EPxx-*.md` 的附录 D。不新建任何进度文件。
