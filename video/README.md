# video/ · Remotion 渲染工程

> 「码上购」成片生产引擎：台词 JSON + 音频槽位 → React 场景组件 → MP4。全程代码，不打开剪辑软件。
> 2026-11-02 PoC 跑通（EP01 痛点现场 4 镜）；同日 EP01 全片 16 镜渲染成片（10:17，TTS 样片配音）。2026-11-03 结尾重做：6.1 拆三镜（金句定格 / 决策树逐条点亮 / 预告压轴金句回屏），全片 18 镜。

## 架构（音频槽位，核心机制）

```
public/episodes/EPxx.json  台词单一事实源（每期一文件）：tts 文本 + 字幕文本 + leadSec/tailSec 节奏参数
public/audio/EPxx/*.mp3    音频槽位（每期一目录）：TTS 样片配音（tools/tts.py，edge-tts 跨平台）→ 样片定稿后真声同名覆盖，时长自动重算
public/audio/EPxx/align.json  逐句时间戳（tts.py 随音频生成）：**音频是唯一时钟**——字幕选句与场景动画锚点（AnchorCtx）都按它走，与语音逐句锁死；真人原声覆盖后需用 whisper 对齐重算
src/data.ts                读 episodes/EPxx.json → SHOTS 数组 + 字幕切分（按句读断句、字数权重分摊）；audioPath() 统一音频槽位路径
src/Episode.tsx            调度器：calculateMetadata 实测音频时长 → 自动铺全片时间轴 + 全局字幕条；镜号→场景映射
src/scene-kit.ts           SceneProps（frames/leadFrames/audioFrames）+ useAnchors：动画锚点按台词进度 0–1 定义，换配音自动适配
src/scenes/*.tsx           每镜一个场景组件（useCurrentFrame 帧驱动动画；EP01 共 18 个）
src/components/*           复用件：SubtitleBar（音画同步字幕）、CodeCard（代码卡，支持 diff 删红增绿 / kw 高亮 / 字号）
src/theme.ts           SOP 色系（本期创建型蓝）唯一取色处，全系列组件禁止硬编码颜色
```

**铁律：场景时长不手写**——由音频实测时长 + 留白自动计算；换配音零改码，重渲即适配。

## 命令

```bash
# 首次准备（Windows / macOS 通用）
npm install              # Node ≥ 18
pip install edge-tts     # Python 3，样片配音依赖

# 日常
python tools/tts.py                                  # （重）生成 TTS 样片配音 + 逐句时间戳 align.json（--voice 可换音色）
npm run lint:colors                                  # 颜色纪律检查（提交前必跑，违规即红）
npm run sheet                                        # 成片自查联系表：每镜首/中/尾 3 帧（SOP §8）
npm run synccheck                                    # 音画同步对照：每镜 4 帧 + 字幕配对表（SOP §8）
npm run dev                                          # Remotion Studio 预览，可拖时间轴
npx remotion still src/index.ts EP01 out/帧名.png --frame=1200  # 单帧（QA 用）
npm run render                                       # 渲染成片 → out/EP01.mp4
```

## 多机协作注意

- 仓库**不含**音频与成片（有意设计，见 .gitignore）：新电脑 clone 后跑完上面「首次准备」+ `python tools/tts.py`，即可完整渲染；
- **真声母带是不可再生资产**：录制后另存 `assets/voice/EPxx/` 并提交入库，再拷入 `public/audio/EPxx/` 参与渲染；
- 样片配音全平台统一音色（edge-tts 神经语音），换机器不影响听感一致；
- 历史：`tools/tts.ps1`（Windows 专属语音）已移除，PoC 阶段产物可在 git 历史找回。

## Agent 工作纪律（在本工程内改东西时）

1. **改画面**：只改 `src/scenes/` 对应镜的组件；颜色只从 `theme.ts` 取——由 `npm run lint:colors` **机制强制**（src 内出现十六进制字面量即报错），提交前必跑；
2. **改台词**：改 `public/episodes/EPxx.json`（`tts` 与 `subtitle` 同步改），然后重跑 `python tools/tts.py`；
3. **QA 铁律：先 still 后 render，出片后必自查**——改动先渲单帧检查；全片渲染前有联系表记录；**出片 ≠ 完成**：每镜抽首/中/尾 3 帧拼联系表 + 头中尾抽听（有声/同步），发现即修即重渲复验，问题清零才勾脚本附录 D（SOP §8）；
4. **音频槽位**：时长与逐句时间戳永远由音频驱动（align.json 是唯一时钟）；禁止在组件里写死场景秒数；换音频后必须重跑 tts.py（或 whisper 对齐）再渲染；
5. **动画锚点按台词字位计算，禁止等间隔拍脑袋**——台词里找关键词的字符位置除以总字数得进度锚点：
   `python -c "s=json.load(open('public/episodes/EP01.json',encoding='utf-8'))[i]['subtitle']; print(s.find('关键词')/len(s))"`
   （教训：3.2 决策树、5.1 警告卡均因拍脑袋锚点音画错位最高 9 秒，2026-11-02 修）；
6. `out/`、`public/audio/` 不进 git（已 ignore）；本目录源码即全部制作资产。

## 现状与全量化待办（PoC → 正片引擎）

- [x] 管线跑通：JSON→组件→渲染→MP4（含音频、字幕）
- [x] 音频槽位：TTS 样片 → 真声终版替换机制
- [x] EP01 全片 18 镜场景组件 + 字幕条 + 代码卡（diff 删红增绿 / kw 高亮）+ 台词进度锚点动画（scene-kit）
- [x] EP01 视觉亮点组件：A1 线程时序、A2 指令重排时间轴（②③ 积木交换 + volatile 焊死）、UML 类图动效、五版对比卡、反射攻击终端实录（Maven 真实输出）、金句定格
- [x] EP01 全片渲染（2026-11-02，TTS 样片配音 10:17；真声定稿后同名覆盖重渲即终版）
- [x] 联系表自动生成脚本（tools/contact-sheet：`npm run sheet`，每镜首/中/尾 3 帧拼表 + 960×540 单帧留档供放大复查；帧区间由 TimelineProbe 合成提供，音频实测驱动）
- [x] 音画对齐治本（2026-11-03）：tts.py 采集词级时间戳 → align.json；字幕按实测时间选句、场景锚点经 AnchorCtx 穿透实测时间轴（场景零改动）——实测 vs 旧字位估算普遍差 0.5–2.2s/句
- [ ] 关键词锚点 API：`atWord("第二，")` 精确落句首（当前字符占比锚点会落在句内按比例处，如 0.917 → 句尾）
- [ ] 真人原声对齐脚本：faster-whisper 词级时间戳 → 重算 align.json（换声流程：覆盖 mp3 → 对齐 → 重渲）
- [ ] episode JSON 契约（Zod）：六段全字段；分镜脚本 → JSON 转换规则（脚本仍是内容事实源，JSON 是制作副本）
- [ ] 竖屏 composition：60 秒切片与正片同源
- [ ] BGM / 音效轨道混音
- [x] 音频路线已定（2026-11）：两阶段——TTS 出样片供确认修改，定稿后真人录音重渲终版（operations §2.2）

**QA 联系表纪律**：全片 render 前多帧拼查留档（EP01 见 `out/qa/contact-sheet.png`，生成当日本机；`out/` 不进 git）。
