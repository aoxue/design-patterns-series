# 参与开发 · CONTRIBUTING

> 面向新加入的开发者。10 分钟从 clone 到能干活。

## 这个项目是什么（30 秒）

「码上购」设计模式系列：23 种 GoF 模式 × 26 期视频。它是一个**内容工程**项目：产出物是视频，生产资料是脚本、示例代码和渲染工程。总纲与排期见 [README.md](README.md)。

## 文档地图（改哪类东西，读哪份）

| 你要改…… | 先读 | 位置 |
|---|---|---|
| 某期内容（脚本/台词/代码案例） | `production-sop.md` + 该期详案 | `episodes-tier1.md`、`scripts/` |
| 渲染工程（画面/动画/出片） | `video/README.md` | `video/` |
| Java 示例代码 | 对应期脚本的代码卡 | `mashanggou/` |
| 排期、状态、运营 | README §4、`operations.md` | 根目录 |

## 环境准备（按需选装，跨平台 Windows / macOS / Linux）

| 碰哪部分 | 依赖 |
|---|---|
| 只改文档/脚本 | 无（文本编辑器即可） |
| `video/` 渲染工程 | Node ≥ 18、Python 3.9+ |
| `mashanggou/` Java 工程 | JDK 17、Maven |

## 本地跑通

```bash
git clone git@github.com:aoxue/design-patterns-series.git
cd design-patterns-series

# 渲染工程（首次）
cd video
npm install
pip install edge-tts
python tools/tts.py     # 生成 TTS 样片配音（音频不入库，clone 后本地重建）
npm run dev             # 打开 Remotion Studio，可拖时间轴预览每一帧
# 出片：npm run render:poc   单帧质检：npx remotion still ...（见 video/README.md）

# Java 工程（另一个终端）
cd mashanggou
mvn -q compile          # 验证编译；Demo 运行方式见对应期脚本
```

> 若本机全局 git 身份不适合用于本项目（比如公司配的机器），先做仓库级覆盖：`git config user.email "你的邮箱"`。

## 怎么找活干

不需要问任何人当前进度，项目状态全部自描述：

1. 打开 [README.md §4 排期看板](README.md#4-排期总表)：**「写脚本」状态的期 = 制作中，优先续完**（受 WIP 约束不并行开新期）；
2. 在制期翻到 `scripts/EPxx-*.md` 的**附录 D**，未勾项就是任务清单；
3. 无在制期则认领排期表最靠前的「未开始」期：读详案 → 按模板写脚本（EP01 是现成范例）。

## 参与方式

- **外部贡献者**：fork → 特性分支 → PR（标题一句话说清改动）；不确定值不值得做先开 issue；
- **维护者**：`main` 单分支直接提交；
- commit message：中文，一句话说清改动（例：「EP01 分镜脚本：DCL 段台词压缩」）。

## 改动约定（两类，别踩）

**内容类**（脚本 / 台词 / 代码案例）以 `production-sop.md` 为宪章，核心几条：

- 差异化三支柱缺一不可：真实业务案例（禁 Shape/Dog 教科书例子）、「什么时候别用」、「框架影子」≥ 2 个 JDK/Spring 例子；
- 每期有效代码 ≤ 80 行，重构用 diff 呈现；
- 脚本里的代码必须实际编译运行过，禁止纸上代码。

**工程类**（`video/`）详见 `video/README.md`，核心三条：

- 场景时长由音频实测驱动，禁止手写秒数；
- 颜色只从 `video/src/theme.ts` 取；
- QA 铁律：先渲单帧检查，过关才渲全片。

**状态纪律**：完成一个产出物就勾掉对应附录 D；期全部完成时更新 README §4 状态列。
