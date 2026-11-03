#!/usr/bin/env node
/** 成片自查联系表生成器（SOP §8「成片自查」的工具化）。
 *  每镜抽首/中/尾 3 帧自动渲染并拼成一张表；帧自带镜号角标（右上角 chrome）。
 *  帧区间来自 TimelineProbe 合成（音频实测驱动，与正片同源）。
 *
 *  用法：npm run sheet
 *  可选：node tools/contact-sheet.mjs --comp EP01 --cols 3 --per-shot 3 --out out/qa
 */
import { mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";
import sharp from "sharp";

const arg = (name, dflt) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : dflt;
};

const COMP = arg("comp", "EP01");
const COLS = Math.max(1, Number(arg("cols", 3))); // 3 = 每行一镜（首/中/尾）
const PER_SHOT = Math.min(3, Math.max(1, Number(arg("per-shot", 3))));
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FRAMES_DIR = path.join(ROOT, arg("out", "out/qa"), "frames");

console.log("▷ 打包工程…");
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts") });

console.log("▷ 读取音频实测时间轴（TimelineProbe）…");
const probe = await selectComposition({ serveUrl, id: `TimelineProbe-${COMP}` });
const timeline = probe.props && probe.props.timeline;
if (!Array.isArray(timeline) || timeline.length === 0) {
  console.error("✗ TimelineProbe 未返回 timeline，检查 src/Root.tsx");
  process.exit(1);
}

// 音频缺失预警：缺音频会退化为估算时长——镜内取样仍有效，但绝对帧位与真实成片有漂移
const audioDirs = await readdir(path.join(ROOT, "public/audio"), { withFileTypes: true })
  .then((xs) => xs.filter((x) => x.isDirectory()).map((x) => x.name))
  .catch(() => []);
let missing = 0;
for (const it of timeline) {
  const found = audioDirs.some((d) => existsSync(path.join(ROOT, "public/audio", d, it.audio)));
  if (!found) missing++;
}
if (missing > 0) {
  console.warn(`⚠ ${missing}/${timeline.length} 段音频缺失（先跑 python tools/tts.py），帧位按估算时长取样`);
}

// 每镜取样帧：首（音频开后 0.5s）/ 中 / 尾（结束前 0.5s）
const fps = probe.fps;
const cells = [];
for (const it of timeline) {
  const head = it.startFrame + Math.round(it.leadSec * fps) + Math.round(0.5 * fps);
  const tail = it.startFrame + it.frames - Math.round(0.5 * fps) - 3;
  const mid = Math.round((head + tail) / 2);
  const picks = PER_SHOT === 1 ? [mid] : PER_SHOT === 2 ? [mid, tail] : [head, mid, tail];
  for (let k = 0; k < picks.length; k++) {
    cells.push({
      shot: it.id,
      frame: Math.min(Math.max(picks[k], it.startFrame + 1), it.startFrame + it.frames - 1),
      file: path.join(FRAMES_DIR, `${it.id}-${["h", "m", "t"][PER_SHOT === 1 ? 1 : k]}.jpg`),
    });
  }
}

await mkdir(FRAMES_DIR, { recursive: true });
const comp = await selectComposition({ serveUrl, id: COMP, inputProps: { timeline } });

console.log(`▷ 渲染 ${cells.length} 帧（3 并发）…`);
const pool = 3;
const total = cells.length;
const queue = [...cells]; // 副本做队列，cells 本体留给拼表
let done = 0;
const worker = async () => {
  while (queue.length) {
    const c = queue.shift();
    await renderStill({
      composition: comp,
      serveUrl,
      output: c.file,
      frame: c.frame,
      inputProps: { timeline },
      imageFormat: "jpeg",
      scale: 0.5, // 960×540 单帧存档：足够放大复查/视觉分析；拼表时再缩半
    });
    console.log(`  ✓ ${c.shot} @${c.frame} (${++done}/${total})`);
  }
};
await Promise.all(Array.from({ length: pool }, worker));

console.log("▷ 拼表…");
const CELL_W = 480;
const CELL_H = 270;
const rows = Math.ceil(cells.length / COLS);
const sheetPath = path.join(path.dirname(FRAMES_DIR), `contact-sheet-${COMP}-${new Date()
  .toISOString()
  .slice(0, 10)}.jpg`);
const thumbs = await Promise.all(
  cells.map((c) => sharp(c.file).resize(CELL_W, CELL_H).jpeg({ quality: 88 }).toBuffer())
);
await sharp({
  create: {
    width: COLS * CELL_W,
    height: rows * CELL_H,
    channels: 3,
    background: { r: 14, g: 20, b: 28 },
  },
})
  .composite(thumbs.map((input, i) => ({ input, left: (i % COLS) * CELL_W, top: Math.floor(i / COLS) * CELL_H })))
  .jpeg({ quality: 88 })
  .toFile(sheetPath);

console.log(`✓ 联系表：${path.relative(process.cwd(), sheetPath)}`);
console.log(`  单帧留档：${path.relative(process.cwd(), FRAMES_DIR)}/（可疑镜用单帧放大复查）`);
