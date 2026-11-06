"""将已认可的 EP01 试听底乐扩展为全片独立音乐轨。

运行：python3 tools/mix_episode_bgm.py [--stem-only]，需 numpy、ffmpeg 和 npm 依赖。
音乐及控制人声取自入库素材，时间轴从当前 TimelineProbe 实测读取；
--stem-only 不依赖旧成片。默认再给已验收的 EP01-with-notes.mp4 混音，视频流原样复制。
配音或台词时长改变后须重新生成 bgm.mp3，音乐轨不能作为口播时钟。
"""
import argparse
import hashlib
import json
import math
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out/bgm-full"
MUSIC = ROOT / "assets/bgm/EP01-preview.mp3"
STEM = ROOT / "public/audio/EP01/bgm.mp3"
SOURCE = ROOT / "out/EP01-with-notes.mp4"
TARGET = ROOT / "out/EP01-with-bgm.mp4"
RATE = 48000


def ffmpeg(*args):
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *map(str, args)], check=True)


def probe(path):
    return json.loads(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)
    ]))


def decode(path, start=None, duration=None):
    options = [] if start is None else ["-ss", str(start)]
    if duration is not None:
        options += ["-t", str(duration)]
    raw = subprocess.check_output([
        "ffmpeg", "-v", "error", *options, "-i", str(path), "-vn", "-f", "f32le",
        "-ar", str(RATE), "-ac", "2", "-",
    ])
    return np.frombuffer(raw, dtype="<f4").reshape(-1, 2)


def rms(samples):
    return float(np.sqrt(np.mean(samples.astype(np.float64) ** 2)))


def timeline():
    # Probe 不绘制场景/音乐，第一次生成 bgm.mp3 时也可读取。
    code = """
import {bundle} from '@remotion/bundler';
import {selectComposition} from '@remotion/renderer';
const serveUrl=await bundle({entryPoint:'src/index.ts'});
const probe=await selectComposition({serveUrl,id:'TimelineProbe-EP01'});
console.log(JSON.stringify({fps:probe.fps,shots:probe.props.timeline}));
"""
    value = json.loads(subprocess.check_output(
        ["node", "--input-type=module", "-e", code], cwd=ROOT, text=True
    ))
    (OUT / "timeline.json").write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
    return value["fps"], value["shots"]


def control_voice(shots, fps):
    """复用原MP3，按Remotion的leadFrames与逐镜帧长铺轨，不重新合成或调整人声增益。"""
    path = OUT / "voice-control.wav"
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(RATE)
        for shot in shots:
            samples = decode(ROOT / "public/audio/EP01" / shot["audio"])
            total = round(shot["frames"] / fps * RATE)
            lead = math.floor(shot["leadSec"] * fps + 0.5) * RATE // fps
            padded = np.zeros((total, 2), dtype=np.float32)
            count = min(len(samples), total - lead)
            padded[lead:lead + count] = samples[:count]
            output.writeframes((np.clip(padded, -1, 1) * 32767).astype("<i2").tobytes())
    return path


def music_loop(duration):
    """同和声相位交叉淡化：素材3秒起的稳定段，8小节后重接，避开原素材的首尾包络。"""
    source = decode(MUSIC)
    stride = round((60 / 74) * 8 * 8 * RATE)
    overlap = round(1.5 * RATE)
    start = 3 * RATE
    segment = source[start:start + stride + overlap].copy()
    if len(segment) != stride + overlap:
        raise ValueError("试听音乐过短，无法取得完整稳定循环段")
    segment[:overlap] *= np.linspace(0, 1, overlap, dtype=np.float32)[:, None]
    segment[-overlap:] *= np.linspace(1, 0, overlap, dtype=np.float32)[:, None]
    count = round(duration * RATE)
    raw_path = OUT / "loop.f32"
    loop = np.memmap(raw_path, dtype="<f4", mode="w+", shape=(count, 2))
    loop[:] = 0
    for offset in range(0, count, stride):
        size = min(len(segment), count - offset)
        loop[offset:offset + size] += segment[:size]
    loop.flush()
    del loop
    path = OUT / "music-loop.wav"
    ffmpeg("-f", "f32le", "-ar", RATE, "-ac", 2, "-i", raw_path,
           "-c:a", "pcm_f32le", path)
    return path, stride / RATE


def stream_hash(path):
    return subprocess.check_output([
        "ffmpeg", "-v", "error", "-i", str(path), "-map", "0:v", "-c:v", "copy",
        "-f", "hash", "-hash", "sha256", "-"
    ], text=True).strip()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--stem-only", action="store_true", help="只重建可入库的独立BGM轨")
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    fps, shots = timeline()
    speech_frames = max(s["startFrame"] + s["frames"] for s in shots)
    duration = speech_frames / fps
    voice = control_voice(shots, fps)
    loop, loop_period = music_loop(duration)
    ducked = OUT / "music-ducked.wav"
    ffmpeg("-i", loop, "-i", voice, "-filter_complex",
           "[0:a][1:a]sidechaincompress=threshold=0.018:ratio=3:attack=35:release=900:makeup=1:level_sc=1[bed]",
           "-map", "[bed]", "-c:a", "pcm_f32le", ducked)
    opening_end = next(s["startFrame"] for s in shots if s["id"] == "1.2") / fps
    gain = rms(decode(voice, 0, opening_end)) * 0.1 / rms(decode(ducked, 0, opening_end))
    # 进入/离开代码段均用1秒过渡，不在镜头边界突然跳音量。
    boundaries = []
    previous = 1.0
    for shot in shots:
        is_code = shot["id"].startswith(("2.", "3.")) or shot["id"] in ("4.2", "4.3")
        level = 10 ** (-8 / 20) if is_code else 1.0
        if level != previous:
            boundaries.append((shot["startFrame"] / fps, level - previous))
        previous = level
    envelope = "1" + "".join(
        f"+({change})*min(max((t-{time - 0.5})/1,0),1)" for time, change in boundaries
    )
    ffmpeg("-i", ducked, "-af",
           f"volume='{gain}*({envelope})':eval=frame,afade=t=in:d=1.8,afade=t=out:st={duration-4}:d=4",
           "-c:a", "libmp3lame", "-b:a", "192k", "-ar", RATE, "-ac", 2, STEM)
    metrics = {}
    for name, sid in (("opening", "0.1"), ("middle_code", "2.4"), ("late_code", "4.3"), ("ending", "6.2")):
        shot = next(s for s in shots if s["id"] == sid)
        start = shot["startFrame"] / fps
        length = shot["frames"] / fps if name != "opening" else opening_end
        voice_rms = rms(decode(voice, start, length))
        music_rms = rms(decode(STEM, start, length))
        metrics[name] = {"voice_rms": voice_rms, "music_rms": music_rms,
                         "music_relative_db": 20 * math.log10(music_rms / voice_rms)}
    manifest = {"music_source": str(MUSIC.relative_to(ROOT)),
                "music_sha256": hashlib.sha256(MUSIC.read_bytes()).hexdigest(),
                "music_loop_seconds": loop_period, "loop_crossfade_seconds": 1.5,
                "speech_frames": speech_frames, "fps": fps, "stem_seconds": duration,
                "duck": {"threshold": 0.018, "ratio": 3, "attack_ms": 35, "release_ms": 900},
                "voice_gain": 1, "normalize": False, "code_reduction_db": 8,
                "metrics": metrics, "subjective_listening": "待导演试听"}
    if not args.stem_only:
        metadata = probe(SOURCE)
        video = next(s for s in metadata["streams"] if s["codec_type"] == "video")
        if int(video["nb_frames"]) != speech_frames + 600:
            raise ValueError("源成片不是当前口播时间轴加20秒笔记卡，拒绝错误版本混音")
        ffmpeg("-i", SOURCE, "-i", STEM, "-filter_complex",
               "[0:a][1:a]amix=inputs=2:normalize=0:duration=first[mix]",
               "-map", "0:v", "-map", "[mix]", "-c:v", "copy", "-c:a", "aac",
               "-b:a", "192k", "-ar", RATE, "-ac", 2, "-movflags", "+faststart", TARGET)
        ffmpeg("-i", TARGET, "-f", "null", "-")
        assert stream_hash(SOURCE) == stream_hash(TARGET), "混音后视频码流改变"
        metadata_after = probe(TARGET)
        output_video = next(s for s in metadata_after["streams"] if s["codec_type"] == "video")
        assert output_video["nb_frames"] == video["nb_frames"]
        peak = 0.0
        for start in range(0, math.ceil(float(metadata_after["format"]["duration"])), 20):
            samples = decode(TARGET, start, 20)
            if len(samples):
                peak = max(peak, float(np.max(np.abs(samples))))
        assert peak < 1, "混音成片音频削波"
        notes = decode(TARGET, duration + 0.1, 19.8)
        assert not np.any(notes), "笔记卡应保持无声"
        manifest.update({"output": str(TARGET.relative_to(ROOT)), "video_stream_unchanged": True,
                         "frames": output_video["nb_frames"], "duration": metadata_after["format"]["duration"],
                         "peak_dbfs": 20 * math.log10(peak), "notes_silent": True,
                         "source_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest()})
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
