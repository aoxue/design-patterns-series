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

/** 与 tools/tts.py、tools/sync-check.mjs 保持同一套断句。
 * 优先完整标点短语，超长短语才按中文片段/代码原子块切分；收尾标点始终跟前条。
 * 26 全角字宽是启发式上限（ASCII 按半字宽），完整长代码可超出，实际宽度由渲染检查。 */
const TOKEN = / ?(?:[0-9A-Za-z_][0-9A-Za-z_().=/<>!+-]*(?: [0-9A-Za-z_().=/<>!+-]+)*|「[^」]*」|《[^》]*》|[一-鿿]+|.)/gu;
const CLOSERS = "）)；，。！？：、》」";
const OPENERS = "（(《「";

// 半角文本按半个汉字估算，避免混排短语因代码字符多而被切碎；最终仍需检查实际渲染宽度。
const estimatedWidth = (text: string) => [...text].reduce((sum, c) => sum + (c.charCodeAt(0) < 128 ? 0.5 : 1), 0);

// 只有无标点短语本身超长才走此兜底；中文连续片段、代码表达式和成对引号优先保持完整。
function splitPhrase(phrase: string): string[] {
  const atoms: string[] = [];
  let opening = "";
  for (const match of phrase.matchAll(TOKEN)) {
    const token = match[0];
    const core = token.trim();
    if (core && OPENERS.includes(core)) {
      opening += token;
    } else if (core && CLOSERS.includes(core) && atoms.length && !opening) {
      atoms[atoms.length - 1] += token;
    } else {
      atoms.push(opening + token);
      opening = "";
    }
  }
  if (opening) atoms.push(opening);
  const pieces: string[] = [];
  let buf = "";
  for (const atom of atoms) {
    // 纯中文且无标点的长串无法自动判断语义；均衡切分，避免末条只剩一两个字。
    const core = atom.trim();
    const chinese = core.match(/^([一-鿿]{27,})([）)；，。！？：、》」]*)$/u);
    const size = chinese ? Math.ceil(chinese[1].length / Math.ceil(chinese[1].length / 26)) : 0;
    const units = chinese ? chinese[1].match(new RegExp(`.{1,${size}}`, "gu"))! : [atom];
    if (chinese) units[units.length - 1] += chinese[2];
    for (const unit of units) {
      if (estimatedWidth(buf + unit) > 26 && buf.trim()) {
        pieces.push(buf.trim());
        buf = "";
      }
      buf += unit;
    }
  }
  if (buf.trim()) pieces.push(buf.trim());
  return pieces;
}

export function splitSubtitles(text: string): string[] {
  const chunks: string[] = [];
  const sentences = text.split(/(?<=[。！？；])/).map((s) => s.trim()).filter(Boolean);
  for (const sentence of sentences) {
    let buf = "";
    for (const raw of sentence.split(/(?<=[，：、])/)) {
      let phrase = raw.trim();
      // 引号可能落在标点后的片段开头，收尾符号仍归前条，不能因长度上限被丢弃。
      while (phrase && CLOSERS.includes(phrase[0]) && (buf || chunks.length)) {
        if (buf) buf += phrase[0];
        else chunks[chunks.length - 1] += phrase[0];
        phrase = phrase.slice(1);
      }
      if (!phrase) continue;
      if (estimatedWidth(buf + phrase) > 26 && buf) {
        chunks.push(buf.trim());
        buf = "";
      }
      if (estimatedWidth(phrase) > 26) {
        const pieces = splitPhrase(phrase);
        chunks.push(...pieces.slice(0, -1));
        buf = pieces[pieces.length - 1] ?? "";
      } else {
        buf += raw.startsWith(" ") && buf ? " " + phrase : phrase;
      }
    }
    if (buf.trim()) chunks.push(buf.trim());
  }
  return chunks;
}
