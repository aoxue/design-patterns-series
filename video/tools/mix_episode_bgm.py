"""按期号与配乐配置生成全片独立音乐轨，可复用到已注册的各期。

运行：python3 tools/mix_episode_bgm.py EP01 [--stem-only]，需 numpy、ffmpeg 和 npm 依赖。
每期配置存 public/episodes/EPxx.bgm.json；音乐与控制人声取自入库素材，
时间轴与完整片长读取当前 Remotion 元数据，--stem-only 不依赖旧成片。
配音、留白或笔记卡时长改变后须重建音乐轨；音乐轨不作为口播时钟。
"""
import argparse
import fnmatch
import hashlib
import json
import math
import subprocess
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parent.parent
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


def timeline(episode, out):
    # Probe 不绘制场景/音乐，第一次生成 bgm.mp3 时也可读取。
    code = """
import {bundle} from '@remotion/bundler';
import {selectComposition} from '@remotion/renderer';
const serveUrl=await bundle({entryPoint:'src/index.ts'});
const episodeId=process.argv[1];
const probe=await selectComposition({serveUrl,id:`TimelineProbe-${episodeId}`});
const composition=await selectComposition({serveUrl,id:episodeId});
console.log(JSON.stringify({fps:probe.fps,totalFrames:composition.durationInFrames,shots:probe.props.timeline}));
"""
    value = json.loads(subprocess.check_output(
        ["node", "--input-type=module", "-e", code, episode], cwd=ROOT, text=True
    ))
    (out / "timeline.json").write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n")
    return value["fps"], value["shots"], value["totalFrames"]


def control_voice(shots, fps, total_frames, audio_dir, out):
    """复用原MP3，按Remotion的leadFrames与逐镜帧长铺轨，不重新合成或调整人声增益。"""
    path = out / "voice-control.wav"
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(RATE)
        for shot in shots:
            samples = decode(audio_dir / shot["audio"])
            total = round(shot["frames"] / fps * RATE)
            lead = math.floor(shot["leadSec"] * fps + 0.5) * RATE // fps
            padded = np.zeros((total, 2), dtype=np.float32)
            count = min(len(samples), total - lead)
            padded[lead:lead + count] = samples[:count]
            output.writeframes((np.clip(padded, -1, 1) * 32767).astype("<i2").tobytes())
        speech_frames = max(s["startFrame"] + s["frames"] for s in shots)
        notes_samples = round((total_frames - speech_frames) / fps * RATE)
        output.writeframes(bytes(notes_samples * 4))
    return path


def music_loop(duration, music, config, out):
    """按素材配置的稳定片段交叉淡化；不同音乐的循环起点和周期分别配置。"""
    source = decode(music)
    stride = round(config["loopPeriodSec"] * RATE)
    overlap = round(config["crossfadeSec"] * RATE)
    start = round(config["loopStartSec"] * RATE)
    segment = source[start:start + stride + overlap].copy()
    if len(segment) != stride + overlap:
        raise ValueError("试听音乐过短，无法取得完整稳定循环段")
    segment[:overlap] *= np.linspace(0, 1, overlap, dtype=np.float32)[:, None]
    segment[-overlap:] *= np.linspace(1, 0, overlap, dtype=np.float32)[:, None]
    count = round(duration * RATE)
    raw_path = out / "loop.f32"
    loop = np.memmap(raw_path, dtype="<f4", mode="w+", shape=(count, 2))
    loop[:] = 0
    for offset in range(0, count, stride):
        size = min(len(segment), count - offset)
        loop[offset:offset + size] += segment[:size]
    loop.flush()
    del loop
    path = out / "music-loop.wav"
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
    parser.add_argument("episode", nargs="?", default="EP01", help="已注册的期号，如 EP01")
    parser.add_argument("--config", type=Path, help="配乐配置路径，相对 video/ 或绝对路径")
    parser.add_argument("--music", type=Path, help="覆盖配置中的音乐素材路径")
    parser.add_argument("--source", type=Path, help="待混音的无 BGM 成片路径")
    parser.add_argument("--output", type=Path, help="配乐成片输出路径")
    parser.add_argument("--stem-only", action="store_true", help="只重建可入库的独立BGM轨")
    args = parser.parse_args()
    episode = args.episode
    config_path = ROOT / (args.config or Path(f"public/episodes/{episode}.bgm.json"))
    if not config_path.is_file():
        parser.error(f"缺少配乐配置 {config_path}；新增该期配置即可复用本脚本")
    config = json.loads(config_path.read_text(encoding="utf-8"))
    if config["loopStartSec"] < 0 or not 0 < config["crossfadeSec"] < config["loopPeriodSec"]:
        parser.error("循环起点须非负，且 0 < crossfadeSec < loopPeriodSec")
    out = ROOT / "out" / f"{episode}-bgm"
    music = ROOT / (args.music or Path(config["music"]))
    audio_dir = ROOT / "public/audio" / episode
    stem = audio_dir / "bgm.mp3"
    source = ROOT / (args.source or Path(f"out/{episode}-with-notes.mp4"))
    target = ROOT / (args.output or Path(f"out/{episode}-with-bgm-notes.mp4"))
    if not args.stem_only and source.resolve() == target.resolve():
        parser.error("输入输出成片不能为同一个文件")
    out.mkdir(parents=True, exist_ok=True)
    fps, shots, total_frames = timeline(episode, out)
    speech_frames = max(s["startFrame"] + s["frames"] for s in shots)
    speech_duration = speech_frames / fps
    duration = total_frames / fps
    voice = control_voice(shots, fps, total_frames, audio_dir, out)
    loop, loop_period = music_loop(duration, music, config, out)
    ducked = out / "music-ducked.wav"
    ffmpeg("-i", loop, "-i", voice, "-filter_complex",
           "[0:a][1:a]sidechaincompress=threshold=0.018:ratio=3:attack=35:release=900:makeup=1:level_sc=1[bed]",
           "-map", "[bed]", "-c:a", "pcm_f32le", ducked)
    calibration_shot = config.get("openingEndShot")
    if calibration_shot:
        matches = [s for s in shots if s["id"] == calibration_shot]
        if not matches:
            raise ValueError(f"配乐配置 openingEndShot={calibration_shot} 不在 {episode} 时间轴中")
        opening_end = matches[0]["startFrame"] / fps
    else:
        opening_end = shots[0]["frames"] / fps
    if opening_end <= 0:
        raise ValueError("开场音量校准区间不能为空，请将 openingEndShot 设为后续镜号")
    gain = rms(decode(voice, 0, opening_end)) * 0.1 / rms(decode(ducked, 0, opening_end))
    # 进入/离开代码段均用1秒过渡，不在镜头边界突然跳音量。
    boundaries = []
    previous = 1.0
    for shot in shots:
        is_code = any(fnmatch.fnmatchcase(shot["id"], pattern) for pattern in config.get("quietShots", []))
        level = 10 ** (-8 / 20) if is_code else 1.0
        if level != previous:
            boundaries.append((shot["startFrame"] / fps, level - previous))
        previous = level
    envelope = "1" + "".join(
        f"+({change})*min(max((t-{time - 0.5})/1,0),1)" for time, change in boundaries
    )
    # 笔记卡没有口播，但保留底乐。静音控制轨会让duck释放，补一层平滑降幅，
    # 将笔记音乐维持在尾镜平均级别，避免人声结束后音乐突然抬升。
    notes_gain = 1.0
    if total_frames > speech_frames:
        ending = shots[-1]
        ending_rms = rms(decode(ducked, ending["startFrame"] / fps, ending["frames"] / fps))
        notes_rms = rms(decode(ducked, speech_duration, duration - speech_duration))
        notes_gain = min(1.0, ending_rms / max(notes_rms, 1e-9))
    notes_envelope = f"1-(1-{notes_gain})*min(max((t-{speech_duration-0.5})/2,0),1)"
    ffmpeg("-i", ducked, "-af",
           f"volume='{gain}*({envelope})*({notes_envelope})':eval=frame,afade=t=in:d=1.8,afade=t=out:st={duration-4}:d=4",
           "-c:a", "libmp3lame", "-b:a", "192k", "-ar", RATE, "-ac", 2, stem)
    metrics = {}
    for shot in shots:
        start = shot["startFrame"] / fps
        length = shot["frames"] / fps
        voice_rms = rms(decode(voice, start, length))
        music_rms = rms(decode(stem, start, length))
        metrics[shot["id"]] = {"voice_rms": voice_rms, "music_rms": music_rms,
                               "music_relative_db": 20 * math.log10(music_rms / voice_rms) if voice_rms else None}
    manifest = {"episode": episode, "config": str(config_path), "music_source": str(music),
                "music_sha256": hashlib.sha256(music.read_bytes()).hexdigest(),
                "music_loop_seconds": loop_period, "loop_crossfade_seconds": config["crossfadeSec"],
                "speech_frames": speech_frames, "total_frames": total_frames, "fps": fps, "stem_seconds": duration,
                "notes_music_gain": notes_gain, "final_fade_seconds": 4,
                "duck": {"threshold": 0.018, "ratio": 3, "attack_ms": 35, "release_ms": 900},
                "voice_gain": 1, "normalize": False, "code_reduction_db": 8,
                "metrics": metrics, "subjective_listening": "待导演试听"}
    if not args.stem_only:
        target.parent.mkdir(parents=True, exist_ok=True)
        metadata = probe(source)
        video = next(s for s in metadata["streams"] if s["codec_type"] == "video")
        if int(video["nb_frames"]) != total_frames:
            raise ValueError("源成片帧数与当前正片元数据不符，拒绝错误版本混音")
        ffmpeg("-i", source, "-i", stem, "-filter_complex",
               "[0:a][1:a]amix=inputs=2:normalize=0:duration=first[mix]",
               "-map", "0:v", "-map", "[mix]", "-c:v", "copy", "-c:a", "aac",
               "-b:a", "192k", "-ar", RATE, "-ac", 2, "-movflags", "+faststart", target)
        ffmpeg("-i", target, "-f", "null", "-")
        assert stream_hash(source) == stream_hash(target), "混音后视频码流改变"
        metadata_after = probe(target)
        output_video = next(s for s in metadata_after["streams"] if s["codec_type"] == "video")
        assert output_video["nb_frames"] == video["nb_frames"]
        peak = 0.0
        for start in range(0, math.ceil(float(metadata_after["format"]["duration"])), 20):
            samples = decode(target, start, 20)
            if len(samples):
                peak = max(peak, float(np.max(np.abs(samples))))
        assert peak < 1, "混音成片音频削波"
        notes_metrics = {}
        if total_frames > speech_frames:
            notes_length = min(3.0, duration - speech_duration)
            notes_start = speech_duration + (duration - speech_duration - notes_length) / 2
            notes = decode(target, notes_start, notes_length)
            notes_stem = decode(stem, notes_start, notes_length)
            notes_voice = decode(source, notes_start, notes_length)
            assert not np.any(notes_voice), "源笔记卡应无口播"
            assert rms(notes) > 1e-5, "笔记卡音乐丢失"
            notes_correlation = float(np.corrcoef(notes.ravel(), notes_stem.ravel())[0, 1])
            # MP3再编码AAC会有低电平量化差异，联合检查波形相关性和能量，不能要求PCM完全一致。
            notes_rms_ratio = rms(notes) / rms(notes_stem)
            assert notes_correlation > 0.995 and 0.98 < notes_rms_ratio < 1.02, "笔记卡音频与独立音乐轨不符"
            notes_metrics = {"notes_no_voice": True, "notes_music_rms": rms(notes),
                             "notes_stem_correlation": notes_correlation, "notes_stem_rms_ratio": notes_rms_ratio}
        fade_head_rms = rms(decode(stem, duration - 4, 0.5))
        fade_tail_rms = rms(decode(stem, duration - 0.5, 0.5))
        assert fade_tail_rms < fade_head_rms / 4, "片尾音乐未充分淡出"
        manifest.update({"output": str(target), "video_stream_unchanged": True,
                         "frames": output_video["nb_frames"], "duration": metadata_after["format"]["duration"],
                         "peak_dbfs": 20 * math.log10(peak), **notes_metrics,
                         "fade_head_rms": fade_head_rms, "fade_tail_rms": fade_tail_rms,
                         "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest()})
    (out / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
