import type { FC } from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { alpha, getPalette, theme } from "../../theme";

/** 无声笔记的阅读停留独立于口播时长，预览与正片共用。 */
export const NOTES_FRAMES = 600;

/** 无声落幕卡：整卡淡入淡出，frames 取本卡时长而非整集时长。 */
export const SingletonNotes: FC<{ frames: number }> = ({ frames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const palette = getPalette("creational");
  const fadeFrames = Math.round(fps * 0.6);
  const opacity = interpolate(
    frame,
    [0, fadeFrames, frames - fadeFrames - 1, frames - 1],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: palette.bg, fontFamily: theme.font.sans }}>
      <div style={{
        position: "absolute", inset: "64px 80px", padding: "48px 64px",
        borderRadius: 24, backgroundColor: theme.text, color: palette.bg, opacity,
        borderTop: `8px solid ${palette.primary}`, boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: palette.umlBorder, letterSpacing: 4 }}>模式笔记</span>
            <span style={{ fontSize: 24, fontFamily: theme.font.mono, color: palette.umlBorder }}>01 / 23</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Img src={staticFile("brand/mashanggou-logo.png")} style={{ width: 64, height: 60, objectFit: "contain" }} />
            <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: 3 }}>码上购</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 22 }}>
          <span style={{ fontSize: 72, fontWeight: 800, letterSpacing: 3 }}>单例模式</span>
          <span style={{ fontSize: 38, fontFamily: theme.font.mono, color: palette.umlBorder }}>Singleton</span>
          <span style={{ marginLeft: "auto", padding: "8px 22px", borderRadius: 24, backgroundColor: palette.umlBg, color: palette.umlBorder, fontSize: 24 }}>创建型</span>
        </div>
        <div style={{ height: 2, backgroundColor: alpha(palette.umlBorder, 0.2), marginTop: 28 }} />

        <div style={{ display: "grid", gridTemplateColumns: "860px 1fr", gap: 56, marginTop: 40 }}>
          <div>
            <div style={{ fontSize: 25, fontWeight: 700, color: palette.umlBorder, letterSpacing: 3 }}>核心意图</div>
            <div style={{ fontSize: 42, fontWeight: 600, lineHeight: 1.6, marginTop: 14 }}>
              保证一个类只有<span style={{ color: palette.umlBorder }}>一个实例</span>，<br />
              并提供访问它的<span style={{ color: palette.umlBorder }}>全局访问点</span>。
            </div>

            <div style={{ fontSize: 25, fontWeight: 700, color: palette.umlBorder, letterSpacing: 3, marginTop: 40 }}>适用场景</div>
            {[
              "某个类只应存在一个实例。",
              "调用方需要通过统一入口访问该实例。",
            ].map((text, i) => (
              <div key={text} style={{ display: "flex", alignItems: "baseline", gap: 20, marginTop: 20 }}>
                <span style={{ fontSize: 24, fontFamily: theme.font.mono, color: palette.umlBorder }}>0{i + 1}</span>
                <span style={{ fontSize: 32, lineHeight: 1.5 }}>{text}</span>
              </div>
            ))}
            <div style={{ marginTop: 32, padding: "18px 24px", borderLeft: `4px solid ${palette.primary}`, backgroundColor: palette.umlBg }}>
              <div style={{ fontSize: 23, color: palette.umlBorder, marginBottom: 6 }}>本集案例</div>
              <div style={{ fontSize: 28 }}>统一管理促销配置的 PromoConfigManager</div>
            </div>
          </div>

          <div style={{ borderLeft: `2px solid ${alpha(palette.umlBorder, 0.18)}`, paddingLeft: 42 }}>
            <div style={{ fontSize: 25, fontWeight: 700, color: palette.umlBorder, letterSpacing: 3 }}>结构速记</div>
            <div style={{ marginTop: 26, border: `2px solid ${palette.umlBorder}`, borderRadius: 12, overflow: "hidden", fontFamily: theme.font.mono }}>
              <div style={{ padding: "22px 12px", backgroundColor: palette.umlBg, textAlign: "center" }}>
                <div style={{ fontSize: 21, color: palette.umlBorder, marginBottom: 10 }}>«Singleton»</div>
                <div style={{ fontSize: 29, fontWeight: 700 }}>PromoConfigManager</div>
              </div>
              <div style={{ borderTop: `2px solid ${palette.umlBorder}`, padding: "22px 20px", fontSize: 25 }}>
                <span style={{ textDecoration: "underline", textUnderlineOffset: 5 }}>- instance: PromoConfigManager</span>
              </div>
              <div style={{ borderTop: `2px solid ${palette.umlBorder}`, padding: "22px 20px", fontSize: 25, lineHeight: 1.9 }}>
                <div>- PromoConfigManager()</div>
                <div style={{ textDecoration: "underline", textUnderlineOffset: 5 }}>+ getInstance()</div>
              </div>
            </div>
            <div style={{ fontSize: 25, lineHeight: 1.8, marginTop: 26, color: palette.umlBorder }}>
              私有构造 · 自持实例 · 统一入口
            </div>
            <div style={{ fontSize: 21, lineHeight: 1.8, marginTop: 14, color: alpha(palette.bg, 0.7) }}>
              − 私有成员　+ 公有成员<br />
              下划线表示静态成员，省略业务方法
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
