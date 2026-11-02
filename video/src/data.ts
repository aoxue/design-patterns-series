import LINES from "../public/lines.json";

export const FPS = 30;

/** 没有音频文件时的估算语速（字/秒），用于 studio 预览兜底 */
export const ESTIMATE_CPS = 4.2;

export interface ShotData {
  id: string;
  audio: string;
  leadSec: number;
  tailSec: number;
  subtitle: string;
}

/** 台词的机器可读来源：public/lines.json（TTS 脚本与字幕共用，单一事实源） */
export const SHOTS: ShotData[] = LINES.map((l) => ({
  id: l.id,
  audio: l.file,
  leadSec: l.leadSec,
  tailSec: l.tailSec,
  subtitle: l.subtitle,
}));

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
