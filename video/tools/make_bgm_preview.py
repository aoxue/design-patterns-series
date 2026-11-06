"""用已验收成片制作 EP01 有/无 BGM 对照，不改配音与渲染工程。

运行：python3 tools/make_bgm_preview.py（需 numpy、ffmpeg、ffprobe）。
底乐由本文件的音符、和弦和振荡器原创合成，不使用第三方歌曲采样。
取样帧区间读取已有 TimelineProbe 输出，不能用于替代完整成片重渲。
"""
import hashlib
import json
import math
import subprocess
import wave
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "out/bgm-preview"
SOURCE = ROOT / "out/EP01-with-notes.mp4"
MUSIC = ROOT / "assets/bgm/EP01-preview.mp3"
RATE = 48000
FPS = 30


def run(*args):
    subprocess.run([str(a) for a in args], check=True)


def ffmpeg(*args):
    run("ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args)


def pcm(path):
    data = subprocess.check_output([
        "ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le",
        "-ac", "2", "-ar", str(RATE), "-",
    ])
    return np.frombuffer(data, dtype="<f4").reshape(-1, 2)


def rms(samples):
    return float(np.sqrt(np.mean(samples.astype(np.float64) ** 2)))


def synth_music(duration):
    """柔和七和弦铺底、稀疏木琴感音符与低频脉冲，刻意避开人声频段的密集旋律。"""
    count = round(duration * RATE)
    audio = np.zeros((count, 2), dtype=np.float64)
    beat = 60 / 74
    bar = beat * 8
    # C 小调：Cm9 / Abmaj7 / Ebmaj9 / Bbadd9，八拍换和弦。
    chords = [(48, 55, 58, 62), (44, 51, 55, 60), (51, 58, 62, 65), (46, 53, 60, 62)]

    def add(start, length, notes, level, pluck=False, pan=0):
        begin = round(start * RATE)
        end = min(count, begin + round(length * RATE))
        if end <= begin:
            return
        t = np.arange(end - begin) / RATE
        envelope = ((1 - np.exp(-t / 0.015)) * np.exp(-t / 0.62) if pluck else
                    np.minimum(t / 1.25, 1) * np.minimum((length - t) / 1.4, 1))
        envelope = np.maximum(envelope, 0)
        for channel in range(2):
            signal = np.zeros_like(t)
            detune = 2 ** ((channel * 2 - 1) * 2.5 / 1200)
            for note in notes:
                frequency = 440 * 2 ** ((note - 69) / 12) * detune
                signal += np.sin(2 * np.pi * frequency * t) + 0.10 * np.sin(4 * np.pi * frequency * t)
            stereo_gain = math.sqrt((1 + (pan if channel else -pan)) / 2)
            audio[begin:end, channel] += signal * envelope * level * stereo_gain / len(notes)

    for index, start in enumerate(np.arange(0, duration, bar)):
        chord = chords[index % len(chords)]
        add(start, bar + 1, chord, 0.28)
        for step in (1, 4.5, 6.5):
            # 高音只点少量和弦音，左右轻微错开，代码段也不会出现密集节拍。
            note = chord[(int(step) + index) % len(chord)] + 12
            add(start + step * beat, 2, (note,), 0.055, pluck=True, pan=(-0.3 if index % 2 else 0.3))
        for step in (0, 2, 4, 6):
            add(start + step * beat, beat * 1.7, (chord[0] - 12,), 0.13, pluck=True)
    # 极轻的双声道延迟，避免干燥的测试音质感。
    dry = audio.copy()
    for seconds, level in ((0.23, 0.14), (0.47, 0.08)):
        delay = round(seconds * RATE)
        audio[delay:] += dry[:-delay, ::-1] * level
    t = np.arange(count) / RATE
    audio *= (np.minimum(t / 1.8, 1) * np.minimum((duration - t) / 2.3, 1))[:, None]
    audio *= 0.18 / max(float(np.max(np.abs(audio))), 1e-9)
    path = OUT / "music-original.wav"
    with wave.open(str(path), "wb") as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(RATE)
        output.writeframes((audio * 32767).astype("<i2").tobytes())
    ffmpeg("-i", path, "-c:a", "libmp3lame", "-b:a", "192k", MUSIC)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    MUSIC.parent.mkdir(parents=True, exist_ok=True)
    timeline_path = ROOT / "out/qa/logo-prerender/timeline.json"
    timeline = json.loads(timeline_path.read_text())
    by_id = {s["id"]: s for s in timeline}
    opening_end = by_id["1.2"]["startFrame"]
    code = by_id["2.3a"]
    ranges = [(0, opening_end), (code["startFrame"], code["startFrame"] + code["frames"])]
    duration = sum(end - start for start, end in ranges) / FPS
    join = opening_end / FPS
    voice = OUT / "voice.wav"
    base = OUT / "base.mp4"
    # 先生成共同的画面与人声基底；A、B 都复制同一条 H.264 流。
    filters = []
    for i, (start, end) in enumerate(ranges):
        filters += [f"[0:v]trim=start_frame={start}:end_frame={end},setpts=PTS-STARTPTS[v{i}]",
                    f"[0:a]atrim=start={start/FPS}:end={end/FPS},asetpts=PTS-STARTPTS[a{i}]"]
    filters += ["[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]"]
    ffmpeg("-i", SOURCE, "-filter_complex", ";".join(filters), "-map", "[v]", "-map", "[a]",
           "-c:v", "libx264", "-preset", "fast", "-crf", "18", "-pix_fmt", "yuv420p",
           "-c:a", "pcm_s16le", "-ar", RATE, "-ac", "2", "-f", "mov", base)
    ffmpeg("-i", base, "-vn", "-c:a", "pcm_s16le", voice)
    synth_music(duration)
    ducked = OUT / "music-ducked.wav"
    # 只用人声控制音乐包络，不压缩或放大人声。较慢释放避免停顿处音乐突然抬升。
    ffmpeg("-i", MUSIC, "-i", voice, "-filter_complex",
           "[0:a][1:a]sidechaincompress=threshold=0.018:ratio=3:attack=35:release=900:makeup=1:level_sc=1[bed]",
           "-map", "[bed]", "-c:a", "pcm_f32le", ducked)
    source_pcm = pcm(voice)
    bed_pcm = pcm(ducked)
    n_open = round(join * RATE)
    gain = rms(source_pcm[:n_open]) * 0.1 / rms(bed_pcm[:n_open])
    shaped = OUT / "music-mixed-level.wav"
    # 代码段比开场再降 8dB，切点前后做 1 秒音量过渡。
    code_gain = 10 ** (-8 / 20)
    expression = f"{gain}*(1-(1-{code_gain})*min(max((t-{join-0.5})/1,0),1))"
    ffmpeg("-i", ducked, "-af", f"volume='{expression}':eval=frame", "-c:a", "pcm_f32le", shaped)
    ffmpeg("-i", base, "-map", "0:v", "-map", "0:a", "-c:v", "copy", "-c:a", "aac",
           "-b:a", "192k", "-ar", RATE, "-ac", "2", "-movflags", "+faststart", OUT / "A-no-bgm.mp4")
    ffmpeg("-i", base, "-i", shaped, "-filter_complex", "[0:a][1:a]amix=inputs=2:normalize=0:duration=first[mix]",
           "-map", "0:v", "-map", "[mix]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
           "-ar", RATE, "-ac", "2", "-movflags", "+faststart", OUT / "B-with-bgm.mp4")
    shaped_pcm = pcm(shaped)
    metrics = {}
    for label, segment in (("opening", slice(0, n_open)), ("code", slice(n_open, None))):
        metrics[label] = {"voice_rms": rms(source_pcm[segment]), "bgm_rms": rms(shaped_pcm[segment]),
                          "bgm_relative_db": 20 * math.log10(rms(shaped_pcm[segment]) / rms(source_pcm[segment]))}
    for name in ("A-no-bgm.mp4", "B-with-bgm.mp4"):
        path = OUT / name
        ffmpeg("-i", path, "-f", "null", "-")
        sound = pcm(path)
        assert float(np.max(np.abs(sound))) < 1, f"{name} 音频削波"
        metrics[name] = {"peak_dbfs": 20 * math.log10(float(np.max(np.abs(sound)))), "rms": rms(sound)}
    hashes = []
    for name in ("A-no-bgm.mp4", "B-with-bgm.mp4"):
        digest = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(OUT/name), "-map", "0:v", "-c:v", "copy", "-f", "hash", "-hash", "sha256", "-"]).decode().strip()
        hashes.append(digest)
    assert hashes[0] == hashes[1], "A/B 视频码流不同"
    manifest = {"source": str(SOURCE.relative_to(ROOT)), "source_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(),
                "timeline": str(timeline_path.relative_to(ROOT)), "fps": FPS, "ranges_frames": ranges,
                "duration_seconds": duration, "opening_seconds": join,
                "music": str(MUSIC.relative_to(ROOT)), "music_origin": "本脚本原创和弦、音符与振荡器合成；无第三方采样",
                "mix": {"opening_target_bgm_db_below_voice_rms": 20, "code_extra_reduction_db": 8,
                        "duck_threshold": 0.018, "duck_ratio": 3, "attack_ms": 35, "release_ms": 900,
                        "voice_gain": 1, "normalize": False},
                "video_stream_sha256": hashes[0], "metrics": metrics,
                "validation": "两版完整解码通过、视频码流一致；主观音乐听感待导演试听"}
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
