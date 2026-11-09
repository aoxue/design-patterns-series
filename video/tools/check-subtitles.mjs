#!/usr/bin/env node
/** 字幕文本规范自查（SOP §4「字幕文本规范」的机制化，2026-11-03 破折号教训落档）。
 *  检查 public/episodes/EPxx.json 的 tts 与 subtitle 字段：
 *    1. 禁破折号「——/—」——书面连接词不上字幕（列举用「：」、轻转折用「，」、另起用「。」）
 *    2. 省略号必须「……」——禁「...」「。。。」和单个「…」
 *    3. 禁半角 , ; ! ? 混入（时间戳 00:01 的冒号豁免）
 *    4. 标点前后不得有空格
 *    5. 中文与西文字母之间须留一个空格（与既有台词风格一致）
 *
 *  用法：npm run lint:subs   （改台词后必跑；exit 1 = 有 error 须修）
 */
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../public/episodes");

/** [正则, 级别, 说明]；级别 error 使 exit 1，warning 仅提示 */
const RULES = [
  [/—/, "error", "破折号（书面连接词，改「：」「，」或「。」）"],
  [/\.\.\.|。。|(?<!…)…(?!…)/, "error", "省略号须为「……」"],
  ...[",", ";", "!", "?"].map((p) => [new RegExp(`\\${p}`), "error", `半角标点 ${p}`]),
  [/(?<=\s)[，。；：、？！…]|[，。；：、？！…](?=\s)/u, "error", "标点旁有空格"],
  [/[\u4e00-\u9fff](?=[A-Za-z])|[A-Za-z](?=[\u4e00-\u9fff])/, "warning", "中文与西文之间无空格"],
];

// 半角标点豁免：时间戳 00:01 形态的冒号不属于台词标点
const EXEMPT = (text) => text.replace(/\d+:\d+/g, "");

// 只读镜头台词文件。同目录另有配音段、BGM 等配置。
const files = (await readdir(DIR)).filter((f) => /^EP\d{2}\.json$/.test(f)).sort();
let errors = 0;
for (const file of files) {
  const shots = JSON.parse(await readFile(path.join(DIR, file), "utf8"));
  for (const shot of shots) {
    for (const field of ["tts", "subtitle"]) {
      const text = shot[field] ?? "";
      const text2 = EXEMPT(text);
      for (const [re, level, msg] of RULES) {
        const m = text2.match(re);
        if (m) {
          const i = m.index;
          console.error(`${level === "error" ? "✗" : "⚠"} ${file} ${shot.id}.${field} ${msg}: …${text.slice(Math.max(0, i - 10), i + 12)}…`);
          if (level === "error") errors++;
        }
      }
    }
  }
}
if (errors) {
  console.error(`\n${errors} 处 error：改词须符合 SOP §4 字幕文本规范后重跑`);
  process.exit(1);
}
console.log(`字幕文本检查通过（${files.length} 个文件）`);
