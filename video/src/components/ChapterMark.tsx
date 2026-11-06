import type { FC } from "react";
import { theme } from "../theme";
import { usePalette } from "../scene-kit";

/**
 * 章节标（EP 系列可复用样式，2026-11-06 v4.1 随 1.4 章节登场卡引入）：
 * 模式中文名 + 英文名的左上角停靠标，登场大字缩小飞入后由它接棒常驻。
 * 只负责样式与排版；出现时机（opacity）由调用方帧驱动传入。
 */
export const ChapterMark: FC<{ cn: string; en: string; opacity: number }> = ({ cn, en, opacity }) => {
  const palette = usePalette();
  return (
    <div
      style={{
        position: "absolute",
        top: 96,
        left: 90,
        display: "flex",
        alignItems: "center",
        gap: 16,
        opacity,
      }}
    >
      <div
        style={{
          width: 6,
          height: 48,
          borderRadius: 3,
          backgroundColor: palette.primary,
          boxShadow: `0 0 18px ${palette.primary}`,
        }}
      />
      <div>
        <div style={{ fontSize: 32, fontWeight: 700, color: theme.text, lineHeight: 1.25 }}>{cn}</div>
        <div style={{ fontSize: 17, color: theme.textMuted, fontFamily: theme.font.mono, letterSpacing: 2 }}>
          {en}
        </div>
      </div>
    </div>
  );
};
