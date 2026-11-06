import type { EpisodeModule } from "./episodes/registry";

export const FPS = 30;

/** 音频槽位路径：每期一个子目录 public/audio/EPxx/ */
export const audioPath = (ep: EpisodeModule, file: string) => `audio/${ep.id}/${file}`;

/** 没有音频文件时的估算语速（字/秒），用于 studio 预览兜底 */
export const ESTIMATE_CPS = 4.2;

export interface ShotData {
  id: string;
  audio: string;
  leadSec: number;
  tailSec: number;
  subtitle: string;
}

/** 与 tools/tts.py 的 split_subtitles 保持同一套断句（改那里须同步这里与 sync-check.mjs）。
 * 断句三级：句末标点 → 逗号/冒号 → 原子块贪心；英文/代码原子块内部不断行，
 * ≥12 字符的原子块独立成条（收尾标点跟随），短的与中文混排装 ≤26 字符。 */
const TOKEN = / ?([0-9A-Za-z_][0-9A-Za-z_().=/<>!+-]*(?: [0-9A-Za-z_().=/<>!+-]+)*)| ?./gu;
const CLOSERS = "）)；，。！？：、》」";
const OPENERS = "（(《「";

export function splitSubtitles(text: string): string[] {
  const sentences = text
    .split(/(?<=[。！？；])/)
    .map((s) => s.trim())
    .filter(Boolean);
  const chunks: string[] = [];
  for (const s of sentences) {
    if (s.length <= 26) {
      chunks.push(s);
      continue;
    }
    let buf = "";
    let leadAtomEnd = 0;
    for (const part of s.split(/(?<=[，——：])/)) {
      const toks = [...part.matchAll(TOKEN)];
      for (let idx = 0; idx < toks.length; idx++) {
        const m = toks[idx], tok = m[0], core = tok.trim();
        if (!core) continue;
        if (CLOSERS.includes(core)) {
          if (buf.trim()) buf += core;
          else if (chunks.length && chunks[chunks.length - 1].length < 28) chunks[chunks.length - 1] += core;
          continue;
        }
        if (buf.length + tok.length > 26 && buf.trim()) {
          if (leadAtomEnd && buf.length - leadAtomEnd <= 8) {
            // 行首大原子 + 短中文尾：原子独立成条，尾巴顺延到下一行
            chunks.push(buf.slice(0, leadAtomEnd).trim());
            buf = buf.slice(leadAtomEnd);
          } else if (buf.trimEnd() && OPENERS.includes(buf.trimEnd().slice(-1))) {
            // 开括号悬尾：随下一行走，避免「（」独行
            const b = buf.trimEnd();
            chunks.push(b.slice(0, -1).trim());
            buf = b.slice(-1);
          } else if (toks[idx][1] !== undefined && toks[idx][1].length >= 8) {
            // 下一 token 是自给自足的大原子块（独立成行不会孤行），直接断行不匀字
            chunks.push(buf.trim());
            buf = "";
          } else {
            // 断行保底：剩余至少 2 个汉字，避免「了；」类孤行
            const tail = toks.slice(idx).map((t) => t[0]).join("");
            let tailCjk = (tail.match(/[一-鿿]/g) || []).length;
            let moved = "";
            while (tailCjk < 2 && buf.length > 9 && !OPENERS.includes(buf[buf.length - 1]) && buf[buf.length - 1] !== " ") {
              moved = buf[buf.length - 1] + moved;
              buf = buf.slice(0, -1);
              tailCjk += 1;
            }
            chunks.push(buf.trim());
            buf = moved;
          }
        }
        const prevLen = buf.length;
        buf += tok;
        if (m[1] !== undefined && core.length >= 12) {
          leadAtomEnd = prevLen === 0 ? buf.length : 0;
        } else if (prevLen === 0) {
          leadAtomEnd = 0;
        }
      }
    }
    if (buf.trim()) chunks.push(buf.trim());
  }
  return chunks;
}
