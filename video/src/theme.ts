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
  codeBg: "#0B1622",
  font: {
    sans: '"Microsoft YaHei", "PingFang SC", sans-serif',
    mono: 'Consolas, "Courier New", monospace',
  },
} as const;
