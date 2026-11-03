import type { FC } from "react";
import { AbsoluteFill } from "remotion";
import { alpha, theme } from "../../theme";
import { useAnchors, type SceneProps, usePalette } from "../../scene-kit";

/**
 * 镜 3.1 · 类图拆解（5:30–6:10）
 * 左：PromoConfigManager UML 盒（对应 EP01-singleton.puml），三成员逐个点亮 + 一句话职责标签；
 * 右：订单/支付/报表三用户浮现，虚线箭头汇聚 getInstance()
 */
const MEMBERS = [
  { sig: "- PromoConfigManager()", label: "private 构造器 · 锁死出生通道", p: 0.13 },
  { sig: "- {static} instance", label: "static 实例 · 自己持有自己", p: 0.2 },
  { sig: "+ {static} getInstance()", label: "全系统唯一正门", p: 0.26 },
];

const EXTRA = [
  { sig: "+ getDiscount(amount) : int", p: 0.3 },
  { sig: "+ refresh() : void", p: 0.31 },
];

const USERS = [
  { name: "OrderService", zh: "订单", p: 0.36 },
  { name: "PaymentService", zh: "支付", p: 0.42 },
  { name: "ReportJob", zh: "报表", p: 0.48 },
];

export const Scene31Uml: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { fade, pop, seen } = useAnchors(leadFrames, audioFrames);
  const palette = usePalette();

  return (
    <AbsoluteFill style={{ padding: "120px 90px 140px" }}>
      <div style={{ fontSize: 38, fontWeight: 700, color: theme.text, marginBottom: 8 }}>
        类图拆解 <span style={{ fontSize: 26, color: theme.textMuted, fontWeight: 400 }}>· 23 个模式里最寒酸的一张图</span>
      </div>

      <div style={{ position: "relative", flex: 1 }}>
        {/* 左：UML 类盒（白底蓝框，与 .puml 同源；创建型 · 蓝） */}
        <div
          style={{
            position: "absolute",
            left: 20,
            top: 30,
            width: 700,
            backgroundColor: palette.umlBg,
            border: `3px solid ${palette.umlBorder}`,
            borderRadius: 10,
            color: palette.bg,
            opacity: pop(0.04),
            transform: `translateY(${(1 - pop(0.04)) * 24}px)`,
            overflow: "hidden",
          }}
        >
          <div style={{ textAlign: "center", padding: "12px 0 4px", fontSize: 22, color: palette.umlBorder, fontFamily: theme.font.mono }}>
            «Singleton»
          </div>
          <div style={{ textAlign: "center", fontSize: 34, fontWeight: 700, fontFamily: theme.font.mono, paddingBottom: 14 }}>
            PromoConfigManager
          </div>
          <div style={{ height: 2, backgroundColor: palette.umlBorder }} />
          <div style={{ padding: "18px 28px", fontFamily: theme.font.mono, fontSize: 25, lineHeight: 2.1 }}>
            {MEMBERS.map((m) => (
              <div key={m.sig} style={{ opacity: seen(m.p) ? 1 : 0.18 }}>
                {m.sig}
                <span
                  style={{
                    fontFamily: theme.font.sans,
                    fontSize: 19,
                    color: palette.umlBorder,
                    marginLeft: 14,
                    border: `1px solid ${palette.umlChip}`,
                    borderRadius: 999,
                    padding: "1px 10px",
                    opacity: fade(m.p + 0.01),
                    backgroundColor: alpha(palette.umlBorder, 0.06),
                  }}
                >
                  {m.label}
                </span>
              </div>
            ))}
            {EXTRA.map((e) => (
              <div key={e.sig} style={{ opacity: seen(e.p) ? 0.75 : 0.18 }}>
                {e.sig}
              </div>
            ))}
          </div>
        </div>

        {/* 右：三个用户类 + 虚线箭头汇聚 getInstance */}
        {USERS.map((u, i) => {
          const y = 60 + i * 190;
          const inn = pop(u.p);
          return (
            <div key={u.name} style={{ position: "absolute", left: 1310, top: y, opacity: inn }}>
              {/* 虚线箭头：从用户卡指向左侧 UML 盒的 getInstance 行 */}
              <div
                style={{
                  position: "absolute",
                  left: -520,
                  top: 44,
                  width: 500,
                  borderTop: `3px dashed ${palette.primary}`,
                  opacity: fade(u.p + 0.015),
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: -536,
                  top: 34,
                  width: 0,
                  height: 0,
                  borderTop: `11px solid transparent`,
                  borderBottom: `11px solid transparent`,
                  borderRight: `18px solid ${palette.primary}`,
                  opacity: fade(u.p + 0.015),
                }}
              />
              <div
                style={{
                  width: 360,
                  backgroundColor: palette.surface,
                  border: `2px solid ${palette.surfaceBorder}`,
                  borderRadius: 10,
                  padding: "20px 26px",
                  transform: `translateX(${(1 - inn) * 60}px)`,
                }}
              >
                <div style={{ fontSize: 27, fontFamily: theme.font.mono, color: theme.text }}>{u.name}</div>
                <div style={{ fontSize: 20, color: theme.textMuted, marginTop: 6 }}>
                  {u.zh} · 不许 new，只走 getInstance()
                </div>
              </div>
            </div>
          );
        })}

        {/* 底部结语 */}
        <div
          style={{
            position: "absolute",
            left: 20,
            bottom: 10,
            width: 1640,
            textAlign: "center",
            fontSize: 30,
            color: theme.text,
            opacity: fade(0.58),
          }}
        >
          没有第二个类，它全部的工作，就是<span style={{ color: palette.primaryBright, fontWeight: 700 }}>管好自己这一个实例</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
