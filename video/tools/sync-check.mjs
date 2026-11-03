#!/usr/bin/env node
/** 音画同步自查（SOP §8 成片自查的同步专项）。
 *  每镜在台词 0.2/0.45/0.7/0.9 处各抽 1 帧（帧内自带字幕），并生成
 *  「镜 | 进度 | 当时字幕 | 帧文件」对照表 —— 供 agent/人逐格核对
 *  「画面正在高亮/出现的元素」与「字幕正在说的话」是否同一件事。
 *
 *  用法：npm run synccheck   →  out/qa/sync/*.jpg + out/qa/sync-report.md
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { selectComposition, renderStill } from "@remotion/renderer";

const SAMPLES = [0.2, 0.45, 0.7, 0.9]; // 避开首尾淡入淡出区
const COMP = "EP01";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "out/qa/sync");

/** 与 src/data.ts 的 splitSubtitles 保持同一套断句逻辑（改那里须同步这里） */
const splitSubtitles = (text) => {
  const sentences = text.split(/(?<=[。！？；])/).map((s) => s.trim()).filter(Boolean);
  const chunks = [];
  for (const s of sentences) {
    if (s.length <= 26) {
      chunks.push(s);
      continue;
    }
    let buf = "";
    for (const part of s.split(/(?<=[，——：])/)) {
      if ((buf + part).length > 26 && buf) {
        chunks.push(buf.trim());
        buf = part;
      } else {
        buf += part;
      }
    }
    if (buf.trim()) chunks.push(buf.trim());
  }
  return chunks;
};

/** 台词进度 t（0–1）时正在显示的字幕条（与 SubtitleBar 同为字数权重分摊） */
const chunkAt = (chunks, t) => {
  const weights = chunks.map((c) => Math.max(c.length, 1));
  const total = weights.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let i = 0; i < chunks.length; i++) {
    acc += weights[i];
    if (t <= acc / total) return chunks[i];
  }
  return chunks[chunks.length - 1];
};

console.log("▷ 打包工程…");
const serveUrl = await bundle({ entryPoint: path.join(ROOT, "src/index.ts") });
const probe = await selectComposition({ serveUrl, id: "TimelineProbe" });
const timeline = probe.props.timeline;
const fps = probe.fps;

// 逐句时间戳（音频是唯一时钟）：有 align.json 时对照表用实测时间，否则退化估算
let alignShots = {};
try {
  alignShots = JSON.parse(
    await (await import("node:fs/promises")).readFile(
      path.join(ROOT, "public/audio", COMP, "align.json"),
      "utf-8"
    )
  ).shots ?? {};
} catch {
  console.warn("⚠ 无 align.json，对照表用字数估算（先跑 python tools/tts.py）");
}

const comp = await selectComposition({ serveUrl, id: COMP, inputProps: { timeline } });
await mkdir(OUT_DIR, { recursive: true });

const rows = [];
const queue = [];
for (const it of timeline) {
  const chunks = splitSubtitles(it.subtitle);
  const timed = alignShots[it.id]?.chunks;
  for (const p of SAMPLES) {
    const frame = Math.round(it.startFrame + it.leadSec * fps + p * it.audioSec * fps);
    const file = `${it.id}-${p}.jpg`;
    let sub;
    if (timed && timed.length > 0) {
      const t = p * it.audioSec;
      sub = "（对齐缺失）";
      for (const c of timed) if (c.s <= t) sub = c.text;
    } else {
      sub = chunkAt(chunks, p);
    }
    queue.push({ shot: it.id, p, frame, file, sub });
  }
}

console.log(`▷ 渲染 ${queue.length} 帧（3 并发）…`);
const pool = 3;
let done = 0;
const tasks = [...queue];
const worker = async () => {
  while (tasks.length) {
    const c = tasks.shift();
    await renderStill({
      composition: comp,
      serveUrl,
      output: path.join(OUT_DIR, c.file),
      frame: c.frame,
      inputProps: { timeline },
      imageFormat: "jpeg",
      scale: 0.5, // 960×540：字幕可读
    });
    done++;
    process.stdout.write(`\r  ${done}/${queue.length}`);
  }
};
await Promise.all(Array.from({ length: pool }, worker));
console.log("");

const report = [
  "# 音画同步对照表",
  "",
  "> 核对方法（逐行，勿按拼图位置猜——视觉模型看拼图会串格）：",
  "> 1. 打开帧文件，先核对帧内底部字幕与「当时字幕」列一致（验证抽帧时刻正确）；",
  "> 2. 再判断画面当前高亮/新出现的元素与字幕是否在讲同一件事；",
  "> 3. 不一致 = 锚点错位，记镜号按台词字位重算（见 video/README 纪律 5）。",
  "",
  "| 镜 | 台词进度 | 当时字幕 | 帧文件 |",
  "|---|---|---|---|",
  ...rows_order(queue).map((c) => `| ${c.shot} | ${c.p} | ${c.sub} | sync/${c.file} |`),
  "",
].join("\n");
await writeFile(path.join(path.dirname(OUT_DIR), "sync-report.md"), report, "utf-8");
console.log("✓ 对照表：out/qa/sync-report.md（帧在 out/qa/sync/）");

function rows_order(q) {
  return q.slice().sort((a, b) => (a.shot === b.shot ? a.p - b.p : a.shot.localeCompare(b.shot, "zh", { numeric: true })));
}
