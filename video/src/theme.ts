/**
 * SOP 色系：创建型 = 蓝（EP01 单例属创建型）。
 * 深色底适配视频观感；全系列组件只从这里取色，保证 26 期一致。
 */
export const theme = {
  bg: "#0A1826",
  surface: "#122C44",
  surfaceBorder: "#1E4A6D",
  primary: "#3B82F6",
  primaryBright: "#7CB6FF",
  text: "#F0F7FF",
  textMuted: "#9FBBD4",
  danger: "#FF5252",
  warn: "#FFB84D",
  ok: "#3FDA8C", // diff 增行 / 通过标记共用
  diffDel: "rgba(255, 82, 82, 0.14)", // 删行底色
  diffAdd: "rgba(63, 218, 140, 0.12)", // 增行底色
  codeBg: "#0B1622",
  // —— 派生色板：全部字面量的唯一落脚点（npm run lint:colors 强制检查） ——
  windowDots: ["#FF5F57", "#FFBD2E", "#28CA42"], // 代码卡窗口栏红黄绿
  codeComment: "#6B8CA8",                        // 手工语法着色·注释
  codePlain: "#DCEBF7",                          // 手工语法着色·正文
  deepBg: "#05070B",                             // 黑场/收尾场景底色（比 bg 更深）
  alertRed: "#FF3B3B",                           // 事故红（00:01、价格冲突等强警示）
  umlBg: "#E3F2FD",                              // 类图卡浅底（与 .puml 同源）
  umlBorder: "#1565C0",                          // 类图卡描边/分隔线
  umlChip: "#90CAF9",                            // 类图浅蓝小件
  accentPurple: "#B58CFF",                       // 第三业务点/通用紫
  font: {
    sans: '"Microsoft YaHei", "PingFang SC", sans-serif',
    mono: 'Consolas, "Courier New", monospace',
  },
} as const;
