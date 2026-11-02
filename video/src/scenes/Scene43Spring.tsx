import type { FC } from "react";
import { AbsoluteFill } from "remotion";
import { CodeCard, type CodeLine } from "../components/CodeCard";
import { theme } from "../theme";
import { useAnchors, type SceneProps } from "../scene-kit";

/**
 * 镜 4.3 · 影子二号 Spring 容器（7:45–8:30）
 * 左：容器仓库动效（@Service 飞入登记 → 三服务从同一格取件 → scope=singleton 特写）；
 * 右：C9 注入版代码 → 格局对比 → 结论：手写单例退休
 */
const C9: CodeLine[] = [
  {
    segs: [
      { text: "@" },
      { text: "Service", kind: "kw" },
    ],
  },
  { segs: [{ text: "public class PromoConfigManager { /* 容器登记：默认 singleton */ }" }] },
  { segs: [], blank: true },
  { segs: [{ text: "public class OrderService {" }] },
  { segs: [{ text: "    private final PromoConfigManager config;" }] },
  {
    segs: [
      { text: "    public OrderService(PromoConfigManager config) {  // " },
      { text: "注入的永远是同一个", kind: "comment" },
    ],
  },
  { segs: [{ text: "        this.config = config;" }] },
  { segs: [{ text: "    }" }] },
  { segs: [{ text: "}" }] },
];

const C9_VIS = [0.1, 0.11, true, 0.36, 0.37, 0.38, 0.39, true, true];

const CONSUMERS = [
  { name: "OrderService", p: 0.2 },
  { name: "PaymentService", p: 0.23 },
  { name: "ReportJob", p: 0.26 },
];

export const Scene43Spring: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { fade, pop, seen } = useAnchors(leadFrames, audioFrames);

  return (
    <AbsoluteFill style={{ padding: "118px 90px 140px" }}>
      <div style={{ fontSize: 36, fontWeight: 700, color: theme.text, marginBottom: 20 }}>
        影子二号 · <span style={{ color: theme.ok }}>Spring 容器</span>
        <span style={{ fontSize: 24, color: theme.textMuted, fontWeight: 400 }}> —— 一个全自动的单例工厂</span>
      </div>

      <div style={{ display: "flex", gap: 36, flex: 1 }}>
        {/* 左：容器仓库动效 */}
        <div style={{ flex: 1.1, position: "relative" }}>
          <div
            style={{
              position: "absolute",
              inset: "0 0 190px 0",
              border: `2px solid ${theme.ok}`,
              borderRadius: 18,
              backgroundColor: "rgba(63, 218, 140, 0.04)",
              padding: "16px 24px",
            }}
          >
            <div style={{ fontSize: 23, color: theme.ok, fontFamily: theme.font.mono, marginBottom: 14 }}>
              ApplicationContext · singleton 仓库
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {/* 装着 PromoConfigManager 的格子 */}
              <div
                style={{
                  width: 300,
                  height: 120,
                  borderRadius: 12,
                  border: `2px solid ${seen(0.12) ? theme.ok : theme.surfaceBorder}`,
                  backgroundColor: "rgba(10, 24, 38, 0.9)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 6,
                  position: "relative",
                  transform: `translateY(${(1 - pop(0.12)) * -60}px)`,
                  opacity: fade(0.1),
                }}
              >
                <span style={{ fontSize: 22, fontFamily: theme.font.mono, color: theme.warn }}>@Service</span>
                <span style={{ fontSize: 21, fontFamily: theme.font.mono, color: theme.text }}>PromoConfigManager</span>
                {/* scope 标签特写 */}
                <span
                  style={{
                    position: "absolute",
                    right: -24,
                    bottom: -22,
                    fontSize: 20,
                    fontFamily: theme.font.mono,
                    color: theme.ok,
                    border: `2px solid ${theme.ok}`,
                    borderRadius: 8,
                    padding: "4px 12px",
                    backgroundColor: theme.bg,
                    transform: `scale(${0.7 + pop(0.28) * 0.3}) rotate(-4deg)`,
                    opacity: pop(0.28),
                  }}
                >
                  scope = singleton
                </span>
              </div>
              {/* 空格子 */}
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 300,
                    height: 120,
                    borderRadius: 12,
                    border: `1px dashed ${theme.surfaceBorder}`,
                    opacity: 0.4,
                  }}
                />
              ))}
            </div>
          </div>

          {/* 三个消费方：连线汇聚到同一格（bottom 抬高 40px，避开字幕条） */}
          <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, display: "flex", gap: 18 }}>
            {CONSUMERS.map((c) => (
              <div key={c.name} style={{ flex: 1, opacity: fade(c.p), position: "relative" }}>
                {/* 向上的连线（虚线 + 顶箭头） */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 86,
                    left: "50%",
                    height: 70,
                    borderLeft: `3px dashed ${theme.ok}`,
                    opacity: fade(c.p + 0.01),
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: 152,
                    left: "50%",
                    marginLeft: -8,
                    width: 0,
                    height: 0,
                    borderLeft: `8px solid transparent`,
                    borderRight: `8px solid transparent`,
                    borderBottom: `14px solid ${theme.ok}`,
                    opacity: fade(c.p + 0.01),
                  }}
                />
                <div
                  style={{
                    backgroundColor: theme.surface,
                    border: `1px solid ${theme.surfaceBorder}`,
                    borderRadius: 10,
                    padding: "14px 18px",
                    textAlign: "center",
                    fontFamily: theme.font.mono,
                    fontSize: 21,
                    color: theme.text,
                  }}
                >
                  {c.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 右：C9 代码 + 格局对比 + 结论 */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
          <CodeCard title="Spring 版 · 注解 + 构造器注入" lines={C9} visible={C9_VIS.map((v) => (typeof v === "boolean" ? v : seen(v)))} fontSize={19} />

          <div
            style={{
              fontSize: 22,
              color: theme.text,
              backgroundColor: theme.surface,
              border: `1px solid ${theme.surfaceBorder}`,
              borderRadius: 12,
              padding: "12px 20px",
              lineHeight: 1.7,
              opacity: fade(0.32),
            }}
          >
            格局变了：持有实例的不是类自己，是<span style={{ color: theme.ok, fontWeight: 700 }}>容器</span>。
            要单例，容器给；想换假实现做测试，容器换 —— 写死在类里的 getInstance 做不到。
          </div>

          <div
            style={{
              borderRadius: 12,
              padding: "16px 22px",
              backgroundColor: "rgba(63, 218, 140, 0.08)",
              border: `1px solid ${theme.ok}`,
              fontSize: 24,
              color: theme.text,
              opacity: pop(0.5),
            }}
          >
            Spring 项目：手写单例退休 ——{" "}
            <span style={{ color: theme.ok, fontWeight: 700 }}>注解 + 注入，就是 2026 年的单例模式</span>
          </div>

          <div style={{ fontSize: 20, color: theme.textMuted, lineHeight: 1.7, opacity: fade(0.66) }}>
            手写五版的意义：看懂别人的轮子 · 应付没有容器的场景（工具类库、纯 JDBC 小项目）
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
