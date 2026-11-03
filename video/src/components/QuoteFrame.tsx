import type { FC } from "react";
import { theme } from "../theme";

/**
 * 金句主句两行（6.1 全屏定格与 6.3 回屏收尾共用，保证两帧视觉一致——封面备选帧取自这里）。
 * 只负责排版；透明度/缩放等动画参数由调用方驱动。
 */
export const QuoteFrame: FC<{ opacity: number; scale: number; y?: number }> = ({
  opacity,
  scale,
  y = 0,
}) => (
  <div style={{ textAlign: "center", opacity, transform: `scale(${scale}) translateY(${y}px)` }}>
    <div style={{ fontSize: 72, fontWeight: 700, color: theme.text, lineHeight: 1.5 }}>
      单例不是设计模式，
    </div>
    <div style={{ fontSize: 72, fontWeight: 700, color: theme.primaryBright, lineHeight: 1.5, marginTop: 10 }}>
      是全局变量的西装版。
    </div>
  </div>
);
