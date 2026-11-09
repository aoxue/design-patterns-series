/**
 * 色彩体系 = 中性 token（theme，全系列恒定）+ 分类色板（PALETTES，按 GoF 分类切换）。
 * 中性 token：功能色（danger/warn/ok/diff）、代码底、字体等，全系列色值不变；
 * 分类色板：画面底色与主色 8 个 token，组件经 usePalette() 取用（Episode 按期注入），
 * 禁止绕过 Provider 直连 PALETTES。十六进制字面量只允许出现在本文件（lint:colors 强制）。
 */

/** GoF 分类标识，兼作 PALETTES 的键；EP00/EP24 等非正片期用 special */
export type Category = "creational" | "structural" | "behavioral" | "special";

/** 一套分类色板：画面底色层级（bg/surface/surfaceBorder）+ 主色（primary/primaryBright）+ 类图卡浅底（uml*） */
export interface CategoryPalette {
  bg: string;
  surface: string;
  surfaceBorder: string;
  primary: string;
  primaryBright: string;
  umlBg: string;
  umlBorder: string;
  umlChip: string;
}

/**
 * 四套分类色板。统一约束（色值经 out/regression/palette-check.mjs 验证）：
 * ① 深色底，text/textMuted 与 bg/surface 的对比度不低于蓝板；
 * ② 主色避开功能色：绿板偏草绿（H≈103–114°，ok/diffAdd 增行绿是薄荷青绿 H≈152°），
 *    橙板 primary 深琥珀 / primaryBright 淡金杏，与亮橙 warn（H≈33° L65%）从深淡两侧拉开；
 * ③ 底色层级与蓝板同族（bg 最深、surface 次之、surfaceBorder 作描边，亮度梯度一致）。
 */
export const PALETTES: Record<Category, CategoryPalette> = {
  // 创建型（EP01/02/06/16/19）：蓝系，色值与 EP01 既有全片视觉逐像素一致（回归基线）
  creational: {
    bg: "#0A1826",
    surface: "#122C44",
    surfaceBorder: "#1E4A6D",
    primary: "#3B82F6",
    primaryBright: "#7CB6FF",
    umlBg: "#E3F2FD",
    umlBorder: "#1565C0",
    umlChip: "#90CAF9",
  },
  // 结构型（EP07–12/15/17/18）：绿系（Material Green 同族的草绿）
  structural: {
    bg: "#071A10",
    surface: "#0F2F1D",
    surfaceBorder: "#1E5333",
    primary: "#41B134",
    primaryBright: "#9FD689",
    umlBg: "#E8F5E9",
    umlBorder: "#2E7D32",
    umlChip: "#A5D6A7",
  },
  // 行为型（EP03/04/05/13/14/20–23）：橙系，饱和亮橙区间（warn/danger 所在）留给功能色
  behavioral: {
    bg: "#201209",
    surface: "#3C2311",
    surfaceBorder: "#5F3B18",
    primary: "#D0691F",
    primaryBright: "#EFD9A4",
    umlBg: "#FBF0DE",
    umlBorder: "#A85B13",
    umlChip: "#EDC79A",
  },
  // 特辑（EP00 先导 / EP24 完结）：紫系，呼应通用强调紫 accentPurple，与三正片色系一眼可分
  special: {
    bg: "#150B22",
    surface: "#251639",
    surfaceBorder: "#3D2459",
    primary: "#9066EA",
    primaryBright: "#C4A5FF",
    umlBg: "#F1E8FD",
    umlBorder: "#5E35B1",
    umlChip: "#CDB4F6",
  },
};

/** 按分类取色板；未知分类视为期模块注册错误，直接抛出（宁可渲染失败也不静默用错色系） */
export const getPalette = (category: string): CategoryPalette => {
  const p = (PALETTES as Record<string, CategoryPalette | undefined>)[category];
  if (!p) throw new Error(`未知分类 ${category}（检查期模块 category 字段与 theme.ts PALETTES）`);
  return p;
};

/** hex(#RRGGBB) + 透明度 → rgba() 字符串：分类色做光晕/半透明底时用，避免组件里散落色值字面量 */
export const alpha = (hex: string, a: number): string => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

/** 全系列恒定的中性 token（名称与色值不随分类变），组件直接 theme.xxx 取用 */
export const theme = {
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
  deepBg: "#05070B",                             // 黑场/收尾场景底色（比各分类 bg 更深）
  alertRed: "#FF3B3B",                           // 事故红（00:01、价格冲突等强警示）
  accentPurple: "#B58CFF",                       // 第三业务点/通用紫
  font: {
    sans: '"Microsoft YaHei", "PingFang SC", sans-serif',
    mono: 'Consolas, "Courier New", monospace',
  },
} as const;
