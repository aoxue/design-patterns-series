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

/** 把整段台词切成字幕条：按句末标点断句，超长句再按逗号聚簇 */
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
    for (const part of s.split(/(?<=[，——：])/)) {
      // 标点切完仍超长的片段（如长串英文/代码，内部无中文标点），
      // 回退到空格（英文词边界）继续贪心装填，避免出现超长字幕条
      if (part.length > 26) {
        for (const word of part.split(/(?<= )/)) {
          if ((buf + word).length > 26 && buf) {
            chunks.push(buf.trim());
            buf = word;
          } else {
            buf += word;
          }
        }
        continue;
      }
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
}
