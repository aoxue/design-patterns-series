# video/ · Remotion 渲染工程

> 「码上购」成片生产引擎：台词 JSON + 音频槽位 → React 场景组件 → MP4。全程代码，不打开剪辑软件。
> 管线已全流程验证，EP01 全片即由本引擎产出；多期化架构就位（scenes 按期分目录 + episodes 注册表 + 四套分类色板），加新期为纯加法。

## 架构（音频槽位，核心机制）

```
public/episodes/EPxx.json  台词制作副本（每期一文件；内容事实源是 scripts/ 分镜脚本）：tts 口播读音稿 + subtitle 字幕文本（与脚本逐字一致，双字段分工见 SOP §4.1）+ leadSec/tailSec 节奏参数
public/episodes/EPxx.segs.json  配音段定义（编导交付物，随台词同步产出）：段划分（≤470 字/段）+ 每段表演指令壳，{镜id} 占位符运行时从 EPxx.json 注入台词（写法见 SOP §4.1）
public/audio/EPxx/*.mp3    音频槽位（每期一目录）：主力 = qwen 声纹配音（tools/tts_qwen.py，一段一条 + 自动质检切镜）；tts.py（edge-tts）降级为无 key 环境快速预览；真声同名覆盖亦走同槽位
public/audio/EPxx/align.json  逐句时间戳：**音频是唯一时钟**，字幕选句与场景动画锚点（AnchorCtx）都按它走；qwen 配音与真人原声统一由 tools/whisper_align.py 重算
src/data.ts                纯函数层：字幕切分（按句读断句、字数权重分摊）、audioPath/computeTimeline（均接期参数，无全局期号）
src/Episode.tsx            通用调度器：按 episodeId 查注册表 → calculateMetadata 实测音频时长铺时间轴 + 全局字幕条 + PaletteCtx 注入色板
src/scene-kit.ts           SceneProps（frames/leadFrames/audioFrames）+ useAnchors + usePalette：动画锚点按台词进度 0–1 定义，换配音自动适配
src/episodes/registry.ts   期注册表：加新期 = 新建 src/episodes/EPxx.tsx（id/title/category/lines/scenes 五样，lines import 自己的 EPxx.json）+ import 进数组，Root 遍历注册 Composition，其余零改码
src/scenes/epXX/*.tsx      场景组件（useCurrentFrame 帧驱动动画；按期分目录，一镜一组件，同族拆镜可共用族文件：EP01 v4 拆镜后 24 镜、20 个文件）
src/components/*           复用件：SubtitleBar（音画同步字幕）、CodeCard（代码卡，支持 diff 删红增绿 / kw 高亮 / 字号）
src/theme.ts           色彩体系唯一取色处：中性 token（theme，全系列恒定）+ 四套分类色板（PALETTES，创建蓝/结构绿/行为橙/特辑紫，Episode 按期经 PaletteCtx 注入，组件 usePalette() 取），禁止硬编码颜色
```

**铁律：场景时长不手写**，由音频实测时长 + 留白自动计算；换配音零改码，重渲即适配。

品牌 Logo 统一存放在 `public/brand/mashanggou-logo.png`（透明背景 PNG）。根目录 README 与视频共用此文件；`Episode.tsx` 在全片左上角系列标识旁展示，配浅色圆角底托，保证各分类深色背景上的辨识度。替换品牌素材时保持路径即可，无需逐镜修改。

## 命令

```bash
# 首次准备（Windows / macOS 通用）
npm install                                          # Node ≥ 18
pip install requests edge-tts faster-whisper "av==13.1.0"   # Python 3；av 固定 13.x（新版移除 metadata_errors，与 faster-whisper 不兼容）
cp .env.example .env                                 # 再填入 DASHSCOPE_API_KEY（.env 已 gitignore；qwen TTS 用）

# 日常
python tools/tts_qwen.py EP01                        # 主力配音：qwen 声纹分段生成 + 质检重掷 + 切镜回槽位（--force 全部重生成，现行段留档先备份到 out/segs/EPxx/bak-时间戳/；--split-only 只切镜）
python tools/whisper_align.py EP01                   # 对齐重算 align.json（qwen 配音与真声统一走此路；--check 只读对比偏差；--model 可调，默认 small）
python tools/whisper_align.py EP01 --rechunk         # 仅修断句时复用现有词级时间戳；音频与台词须保持不变
python tools/tts.py                                  # 降级：edge-tts 快速预览（无 key 环境可用，随音频产出同构 align.json）
python tools/record_script.py EP01                   # 导出导演录音稿（tts 口播读音稿按镜分段，一镜一条录音工作法；--out 可指定位置）
# 国内网络首次下载 whisper 模型：前面加 HF_ENDPOINT=https://hf-mirror.com
npm run lint:colors                                  # 颜色纪律检查（提交前必跑，违规即红）
npm run sheet                                        # 成片自查联系表：每镜首/中/尾 3 帧（SOP §8）
npm run synccheck                                    # 音画同步对照：每镜 4 帧 + 字幕配对表（SOP §8）
npm run dev                                          # Remotion Studio 预览，可拖时间轴
npx remotion still src/index.ts EP01 out/帧名.png --frame=1200  # 单帧（QA 用；也可 npm run still -- EP01 out/帧名.png --frame=1200）
npm run render -- EP01 out/EP01.mp4                  # 渲染成片（期号透传给 remotion，加新期零改码）
# ⚠ render/still 的合成号与输出路径必须显式给出：裸跑 npm run render（不带 -- 参数）会进入
#   remotion 交互选择，在无终端环境（AI 后台派单/CI）下表现为「chrome 起了但 0% CPU 挂死」，
#   极易误判为渲染资源泄漏（实测踩坑）
```

## qwen TTS 坑清单（EP01 全片实战，tts_qwen.py 已内置对策）

| # | 坑 | 对策（工具内置 / 写作纪律） |
|---|---|---|
| 1 | 长 prompt 尾部整镜被吞（S1 两次漏念 1.4） | 段以悬念/自然收尾点结束，别让重要镜吊段尾（编导分段纪律） |
| 2 | 同参数多次生成结果不同（seed 不保复现） | 质检 + 自动重掷是标配，不是异常处理 |
| 3 | 偶发纯非语音输出（92s 转写零字） | 复读比下限拦截，删段重掷 |
| 4 | 表演指令管语气不管节奏（prompt 写「从容」无效） | 语速只用 `rate` 硬参数压（默认 0.85 ≈ 310 字/分） |
| 5 | 输出上限 120s（播客场景 240s） | 段预算 ≤470 字（5.1 字/秒估算） |
| 6 | audiogen 会自配背景音乐/环境音 | 指令壳尾保留「只有干净人声」约束句（F 定稿配方实证） |
| 7 | 带参考音频时 mp3 时长头谎报（36s 头/14s 数据） | 生成后必过 ffmpeg 归一化 |
| 8 | 短文本（<100 字）机械感显著 | 一段一条连念（74 字版 vs 470 字版自然度差一个档次） |
| 9 | 时长头谎报会顺带污染 Remotion 时长计算 | 同 7；切镜产物全部重编码 |
| 10 | Windows 无系统 ffmpeg 时 tts_qwen/whisper 工具链归一化步抛 WinError 2 | PATH 前置 Remotion 自带 compositor：`node_modules\@remotion\compositor-win32-x64-msvc\`（含 ffmpeg/ffprobe n7.1，带 libmp3lame）；或安装系统 ffmpeg |

配方参数（segs.json 顶层）：`voice`（声纹参考，assets/voice/ 全系列统一）+ `rate 0.85` + `seed 42`。每段实际下发的完整 prompt 留档在 `out/segs/EPxx/Sx.prompt.txt`，质量复盘对照用。

## 多机协作注意

- 渲染输入 `public/audio/EPxx/*.mp3` 与 `align.json` 随 Git 管理：新电脑同步对应提交并安装 npm 依赖后即可渲染，不要为复现成片重新生成配音；成片与试音备份仍不入库。
- **真声母带是不可再生资产**：录制后另存 `assets/voice/EPxx/` 并提交入库，再拷入 `public/audio/EPxx/` 参与渲染；
- 样片配音全平台统一音色（edge-tts 神经语音），换机器不影响听感一致；
- 历史：`tools/tts.ps1`（Windows 专属语音）已移除，PoC 阶段产物可在 git 历史找回。

## Agent 工作纪律（在本工程内改东西时）

1. **改画面**：只改 `src/scenes/` 对应镜的组件；颜色只从 `theme.ts` 取，由 `npm run lint:colors` **机制强制**（src 内出现十六进制字面量即报错），提交前必跑；
2. **改台词**：改 `public/episodes/EPxx.json`（`tts` 与 `subtitle` 同步改），跑 `npm run lint:subs`（字幕文本规范，SOP §4.1：禁破折号「——」等），然后重跑 `python tools/tts.py`；
3. **QA 铁律：先 still 后 render，出片后必自查**。改动先渲单帧检查；全片渲染前有联系表记录；**出片 ≠ 完成**：每镜抽首/中/尾 3 帧拼联系表 + 头中尾抽听（有声/同步），发现即修即重渲复验，问题清零才勾脚本附录 D（SOP §8）；
4. **音频槽位**：时长与逐句时间戳永远由音频驱动（align.json 是唯一时钟）；禁止在组件里写死场景秒数；换音频后必须重跑 tts.py（或 whisper 对齐）再渲染；
5. **动画锚点按台词字位计算，禁止等间隔拍脑袋**，台词里找关键词的字符位置除以总字数得进度锚点：
   `python -c "s=json.load(open('public/episodes/EP01.json',encoding='utf-8'))[i]['subtitle']; print(s.find('关键词')/len(s))"`
   （教训：3.2 决策树、5.1 警告卡均因拍脑袋锚点音画错位最高 9 秒）；
6. `out/` 不进 git；实际使用的 `public/audio/EPxx/*.mp3` 与 `align.json` 必须和代码、台词同步提交，保证跨机器可复现。

## 现状与全量化待办（PoC → 正片引擎）

- [x] 管线跑通：JSON→组件→渲染→MP4（含音频、字幕）
- [x] 音频槽位：TTS 样片 → 真声终版替换机制
- [x] EP01 全片 18 镜场景组件 + 字幕条 + 代码卡（diff 删红增绿 / kw 高亮）+ 台词进度锚点动画（scene-kit）
- [x] EP01 视觉亮点组件：A1 线程时序、A2 指令重排时间轴（②③ 积木交换 + volatile 焊死）、UML 类图动效、五版对比卡、反射攻击终端实录（Maven 真实输出）、金句定格
- [x] EP01 全片渲染（2026-11-02，TTS 样片配音 10:17；真声定稿后同名覆盖重渲即终版）
- [x] 联系表自动生成脚本（tools/contact-sheet：`npm run sheet`，每镜首/中/尾 3 帧拼表 + 960×540 单帧留档供放大复查；帧区间由 TimelineProbe 合成提供，音频实测驱动）
- [x] 音画对齐治本（2026-11-03）：tts.py 采集词级时间戳 → align.json；字幕按实测时间选句、场景锚点经 AnchorCtx 穿透实测时间轴（场景零改动），实测 vs 旧字位估算普遍差 0.5–2.2s/句
- [ ] 关键词锚点 API：`atWord("第二，")` 精确落句首（当前字符占比锚点会落在句内按比例处，如 0.917 → 句尾）
- [x] 真人原声对齐脚本（2026-11-03 就绪，EP01 真声阻塞项解除）：`tools/whisper_align.py`，faster-whisper 词级时间戳 + difflib 字符对齐（容忍识别误差，断句逻辑 import 自 tts.py 单一副本）；EP01 TTS 全片实测偏差 avg 0.18s / max 0.60s（222 chunk），覆盖率低于 60% 的镜自动警告复听
- [ ] episode JSON 契约（Zod）：六段全字段；分镜脚本 → JSON 转换规则（脚本仍是内容事实源，JSON 是制作副本）
- [ ] 竖屏 composition：60 秒切片与正片同源
- [ ] BGM / 音效轨道混音
- [x] 音频路线已定（2026-11）：两阶段：TTS 出样片供确认修改，定稿后真人录音重渲终版（operations §2.2）
- [x] 引擎多期化（2026-11-03）：scenes 按期分目录 + episodes/registry 注册表 + 四套分类色板；加新期纯加法（scenes/epXX/ + episodes/EPxx.tsx + registry 一行），EP01 三帧逐像素与全片时长（19703 帧）回归一致

**QA 联系表纪律**：全片 render 前多帧拼查留档（EP01 见 `out/qa/contact-sheet.png`，生成当日本机；`out/` 不进 git）。
