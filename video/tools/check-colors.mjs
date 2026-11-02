#!/usr/bin/env node
/** 颜色纪律检查：src/ 下除 theme.ts 外禁止十六进制颜色字面量。
 *  rgba()/具名色暂不限制（半透明 scrim、阴影常需就地写，且可读性无损）。
 *  用法：npm run lint:colors —— 提交前必跑，违反即非零退出。 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const srcDir = fileURLToPath(new URL("../src", import.meta.url));
const HEX = /#[0-9a-fA-F]{6}\b/g;

let bad = 0;
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      walk(p);
      continue;
    }
    if (!/\.(tsx?|jsx?)$/.test(name) || name === "theme.ts") continue;
    const lines = readFileSync(p, "utf8").split("\n");
    lines.forEach((line, i) => {
      const m = line.match(HEX);
      if (m) {
        bad += m.length;
        console.error(`${p}:${i + 1}  ${m.join(" ")}  <- 颜色请从 src/theme.ts 取`);
      }
    });
  }
};
walk(srcDir);

if (bad) {
  console.error(`\n✗ ${bad} 处字面量颜色（纪律：颜色只从 theme.ts 取）`);
  process.exit(1);
}
console.log("✓ 无字面量颜色（theme.ts 之外）");
