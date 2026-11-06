import type { FC } from "react";
import { AbsoluteFill, Easing, interpolate, spring, useVideoConfig } from "remotion";
import { CodeCard, type CodeLine } from "../../components/CodeCard";
import { alpha, theme } from "../../theme";
import { useAnchors, usePalette, type SceneProps } from "../../scene-kit";

/**
 * 镜 1.2 · 案发现场（0:31–1:09）
 * 左：三个文件各自 new 的代码卡逐组显形；右：三个「自己」各自缓存、各自刷新节奏
 * v4.1 锚点实测化：三组 new 高亮与右侧行改踩「订单服务/支付服务/报表任务」实测词位
 * （18.1s/19.8s/21.9s，原绝对帧 40/320/600 与语速漂移最大 16s，代码大幅早出）。
 */
const LINES: CodeLine[] = [
  { segs: [{ text: "// order/OrderService.java", kind: "comment" }] },
  {
    segs: [
      { text: "private final PromoConfigManager config = " },
      { text: "new PromoConfigManager()", kind: "danger" },
      { text: ";" },
    ],
  },
  { segs: [], blank: true },
  { segs: [{ text: "// payment/PaymentService.java", kind: "comment" }] },
  {
    segs: [
      { text: "private final PromoConfigManager config = " },
      { text: "new PromoConfigManager()", kind: "danger" },
      { text: ";" },
    ],
  },
  { segs: [], blank: true },
  { segs: [{ text: "// report/ReportJob.java", kind: "comment" }] },
  {
    segs: [
      { text: "private final PromoConfigManager config = " },
      { text: "new PromoConfigManager()", kind: "danger" },
      { text: ";" },
    ],
  },
];

export const CrimeScene: FC<SceneProps> = ({ leadFrames, audioFrames }) => {
  const { frame, fps, atWord, fadeAt } = useAnchors(leadFrames, audioFrames);
  const palette = usePalette();

  // 三组代码显形踩实测词位：台词念到哪个服务，哪组 new 落地（v4.1）
  const GROUP_AT = [
    atWord("订单服务", 0.47),
    atWord("支付服务", 0.55),
    atWord("报表任务", 0.61),
  ];

  // 首项圆点用分类主色（色板随期切换），其余为中性功能色
  const SERVICES = [
    { name: "订单服务", dot: palette.primary, clock: "刷新 5 秒", clockHot: true },
    { name: "支付服务", dot: theme.warn, clock: "刷新 整点", clockHot: false },
    { name: "报表任务", dot: theme.accentPurple, clock: "刷新 整点", clockHot: false },
  ];

  const titleIn = interpolate(frame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // 每行开始出现的帧号（注释/代码同帧起，组内代码行略迟 26 帧）
  const revealAt = LINES.map((_, i) => {
    const group = Math.floor((i + 1) / 3);
    const offsetInGroup = (i + 1) % 3;
    return Math.round(GROUP_AT[group]) + (offsetInGroup === 2 ? 26 : 0);
  });

  const cardIn = interpolate(frame, [10, 40], [80, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  // 右侧三行：与各自代码组同拍（略迟 8 帧错落）；footer 踩「商品页读的是订单那个」
  // （用「读的是」定位：全镜唯一的第二处商品页段，第一处「商品页秒级刷成新价」在 7.5s 附近）
  const rowIn = (i: number) =>
    spring({ frame: frame - Math.round(GROUP_AT[i]) - 8, fps, config: { damping: 12 } });
  const footerIn = fadeAt(atWord("读的是", 0.74), 18);

  return (
    <AbsoluteFill style={{ padding: "150px 90px 170px" }}>
      <div style={{ fontSize: 40, fontWeight: 700, color: theme.text, opacity: titleIn, marginBottom: 36 }}>
        案发现场：<span style={{ fontFamily: theme.font.mono, color: palette.primaryBright }}>PromoConfigManager</span> 被实例化了 3 次
      </div>

      <div style={{ display: "flex", gap: 56, flex: 1 }}>
        <div style={{ flex: 1.15, transform: `translateY(${cardIn}px)` }}>
          <CodeCard title="mashanggou-promo · 事故代码" lines={LINES} revealAt={revealAt} />
        </div>

        <div style={{ flex: 1 }}>
          <div
            style={{
              backgroundColor: palette.surface,
              border: `1px solid ${palette.surfaceBorder}`,
              borderRadius: 14,
              padding: "30px 34px",
              height: "100%",
              boxSizing: "border-box",
            }}
          >
            <div style={{ fontSize: 26, color: theme.textMuted, marginBottom: 26 }}>三个「自己」</div>
            {SERVICES.map((s, i) => (
              <div
                key={s.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 18,
                  padding: "20px 22px",
                  borderRadius: 12,
                  backgroundColor: alpha(palette.bg, 0.7),
                  marginBottom: 18,
                  opacity: rowIn(i),
                  transform: `translateX(${(1 - rowIn(i)) * 40}px)`,
                }}
              >
                <div style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: s.dot }} />
                <span style={{ fontSize: 30, color: theme.text, width: 150 }}>{s.name}</span>
                <span
                  style={{
                    fontSize: 22,
                    color: theme.textMuted,
                    border: `1px solid ${palette.surfaceBorder}`,
                    borderRadius: 999,
                    padding: "4px 14px",
                  }}
                >
                  独立缓存
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 22,
                    color: s.clockHot ? theme.warn : theme.textMuted,
                    border: `1px solid ${s.clockHot ? theme.warn : palette.surfaceBorder}`,
                    borderRadius: 999,
                    padding: "4px 14px",
                  }}
                >
                  {s.clock}
                </span>
              </div>
            ))}
            <div style={{ fontSize: 25, color: theme.textMuted, lineHeight: 1.7, opacity: footerIn, marginTop: 8 }}>
              昨晚 23:59 改的规则，商品页 5 秒知道，<span style={{ color: theme.warn }}>支付要等今天整点</span>。
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
