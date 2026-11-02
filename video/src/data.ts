import EP01_LINES from "../public/episodes/EP01.json";

export const FPS = 30;

/** 当前渲染的期号；全量化后由 content-loader 按期加载 episodes/*.json */
export const EPISODE = "EP01";

/** 音频槽位路径：每期一个子目录 public/audio/EPxx/ */
export const audioPath = (file: string) => `audio/${EPISODE}/${file}`;

/** 没有音频文件时的估算语速（字/秒），用于 studio 预览兜底 */
export const ESTIMATE_CPS = 4.2;

export interface ShotData {
  id: string;
  audio: string;
  leadSec: number;
  tailSec: number;
  subtitle: string;
}

/** 台词的机器可读来源：public/episodes/EPxx.json（TTS 脚本与字幕共用，每期一文件） */
export const SHOTS: ShotData[] = EP01_LINES.map((l) => ({
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
