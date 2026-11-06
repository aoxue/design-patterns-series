import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = readFileSync(path.join(ROOT, "src/data.ts"), "utf8");
const compiled = ts.transpileModule(data, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const context = { exports: {} };
vm.runInNewContext(compiled, context);
const split = (text) => Array.from(context.exports.splitSubtitles(text));
const normalize = (text) => text.replace(/\s/gu, "");

const examples = [
  "",
  "大家好，这里是码上购。",
  "HashMap 并发写，甚至会把内部结构写坏，整台服务卡死。",
  "点开 JDK 源码：private static final Runtime currentRuntime = new Runtime()，标准的饿汉式，和我们第一版一个模子刻出来的。",
  "所以解法不在单例模式里：要么换成 ConcurrentHashMap、给写路径加锁，要么干脆让单例无状态。",
  "同样的炮弹打向枚举：这次，newInstance 直接被 JVM 拦下，抛 IllegalArgumentException。",
  "双检锁 DCL（Double Checked Locking）。",
  "甲".repeat(53) + "。",
  "「这里有个逗号，」后面的中文也需要完整保留。",
  "a".repeat(60) + "，后面继续讲中文。",
];
const episodes = JSON.parse(readFileSync(path.join(ROOT, "public/episodes/EP01.json"), "utf8"));
const texts = [...examples, ...episodes.map((s) => s.subtitle)];

test("中文按完整标点短语断开，代码和其后标点保持完整", () => {
  const hash = split(examples[2]);
  assert.ok(hash.some((line) => line.includes("整台服务卡死")));
  assert.ok(!hash.some((line) => line.endsWith("整台服") || line.startsWith("务卡死")));
  const runtime = split(examples[3]);
  assert.ok(runtime.includes("private static final Runtime currentRuntime = new Runtime()，"));
  const map = split(examples[4]);
  assert.ok(map.some((line) => line.includes("ConcurrentHashMap、")));
  assert.ok(split(examples[5]).includes("抛 IllegalArgumentException。"));
  assert.ok(split(examples[6]).some((line) => line.includes("（Double Checked Locking）")));
  const longChinese = split(examples[7]);
  assert.ok(longChinese.length > 1);
  assert.ok(longChinese.every((line) => line.length >= 2 && line.length <= 27));
});

test("EP01 全量及边界样例无丢字、无条首收尾标点、无悬空开括号", () => {
  for (const text of texts) {
    const lines = split(text);
    assert.equal(normalize(lines.join("")), normalize(text), text);
    for (const line of lines) {
      assert.ok(line.trim(), text);
      assert.ok(!/^[）)；，。！？：、》」]/u.test(line), line);
      assert.ok(!/[（(《「]$/u.test(line), line);
    }
  }
});

test("Python、渲染 TS、同步检查 JS 三处输出逐条一致", () => {
  const source = readFileSync(path.join(ROOT, "tools/sync-check.mjs"), "utf8");
  const extracted = source.slice(source.indexOf("const TOKEN ="), source.indexOf("/** 台词进度"));
  const sandbox = {};
  vm.runInNewContext(extracted + "\nglobalThis.split = splitSubtitles;", sandbox);
  const result = spawnSync("python3", ["-c", `
import json, sys
sys.path.insert(0, 'tools')
from tts import split_subtitles
print(json.dumps([split_subtitles(t) for t in json.load(sys.stdin)], ensure_ascii=False))
`], { cwd: ROOT, input: JSON.stringify(texts), encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const python = JSON.parse(result.stdout);
  texts.forEach((text, i) => {
    assert.deepEqual(split(text), python[i], text);
    assert.deepEqual(Array.from(sandbox.split(text)), python[i], text);
  });
});
