# video/ · Remotion 渲染工程

> 「码上购」成片生产引擎：台词 JSON + 音频槽位 → React 场景组件 → MP4。全程代码，不打开剪辑软件。
> 架构决策与验证记录见仓库对话史（2026-11-02 PoC 跑通，EP01 痛点现场 4 镜 100 秒成片）。

## 架构（音频槽位，核心机制）

```
public/lines.json      台词单一事实源：tts 文本 + 字幕文本 + leadSec/tailSec 节奏参数
public/audio/*.mp3     音频槽位：TTS 样片配音（tools/tts.py，edge-tts 跨平台）→ 样片定稿后真声同名覆盖，时长自动重算
src/data.ts            读 lines.json → SHOTS 数组 + 字幕切分（按句读断句、字数权重分摊）
src/PocEpisode.tsx     调度器：calculateMetadata 实测音频时长 → 自动铺全片时间轴 + 全局字幕条
src/scenes/*.tsx       每镜一个场景组件（useCurrentFrame 帧驱动动画）
src/components/*       复用件：SubtitleBar（音画同步字幕）、CodeCard（代码卡）
src/theme.ts           SOP 色系（本期创建型蓝）唯一取色处，全系列组件禁止硬编码颜色
```

**铁律：场景时长不手写**——由音频实测时长 + 留白自动计算；换配音零改码，重渲即适配。

## 命令

```bash
# 首次准备（Windows / macOS 通用）
npm install              # Node ≥ 18
pip install edge-tts     # Python 3，占位配音依赖

# 日常
python tools/tts.py                                  # （重）生成 TTS 样片配音（--voice 可换音色）
npm run dev                                          # Remotion Studio 预览，可拖时间轴
npx remotion still src/index.ts EP01PoC out/帧名.png --frame=1200  # 单帧（QA 用）
npm run render:poc                                     # 渲染成片 → out/EP01-PoC.mp4
```

## 多机协作注意

- 仓库**不含**音频与成片（有意设计，见 .gitignore）：新电脑 clone 后跑完上面「首次准备」+ `python tools/tts.py`，即可完整渲染；
- **真声母带是不可再生资产**：录制后另存 `assets/voice/EPxx/` 并提交入库，再拷入 `public/audio/` 参与渲染；
- 占位配音全平台统一音色（edge-tts 神经语音），换机器不影响听感一致；
- 历史：`tools/tts.ps1`（Windows 专属语音）已移除，PoC 阶段产物可在 git 历史找回。

## Agent 工作纪律（在本工程内改东西时）

1. **改画面**：只改 `src/scenes/` 对应镜的组件；颜色只从 `theme.ts` 取；
2. **改台词**：改 `public/lines.json`（`tts` 与 `subtitle` 同步改），然后重跑 `python tools/tts.py`；
3. **QA 铁律：先 still 后 render**——任何改动先渲 1–2 个关键帧检查重叠/溢出/对齐，过关才渲全片；全片渲染前必须有联系表（多帧拼查）记录；
4. **音频槽位**：时长永远由音频驱动；禁止在组件里写死场景秒数；
5. `out/`、`public/audio/` 不进 git（已 ignore）；本目录源码即全部制作资产。

## 现状与全量化待办（PoC → 正片引擎）

- [x] 管线跑通：JSON→组件→渲染→MP4（含音频、字幕）
- [x] 音频槽位：占位 TTS → 真声替换机制
- [x] 4 个场景组件 + 字幕条 + 代码卡
- [ ] episode JSON 契约（Zod）：六段全字段；分镜脚本 → JSON 转换规则（脚本仍是内容事实源，JSON 是制作副本）
- [ ] 补齐组件：diff 删红增绿、UML 类图动效、线程时序/指令重排时间轴（EP01 视觉亮点）、终端实录（接 Maven 真实输出）、五版本对比卡、金句定格
- [ ] 竖屏 composition：60 秒切片与正片同源
- [ ] BGM / 音效轨道混音
- [x] 音频路线已定（2026-11）：两阶段——TTS 出样片供确认修改，定稿后真人录音重渲终版（operations §2.2）
