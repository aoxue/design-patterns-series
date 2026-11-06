"""验证不同期号/镜号及有无笔记卡都可复用混音脚本；需要 ffmpeg、numpy。"""
import contextlib
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import mix_episode_bgm as mixer


class EpisodeBgmTest(unittest.TestCase):
    def test_probe_uses_requested_episode(self):
        result = {"fps": 30, "shots": [], "totalFrames": 300}
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(mixer.subprocess, "check_output", return_value=json.dumps(result)) as call:
                self.assertEqual(mixer.timeline("EP99", Path(directory)), (30, [], 300))
            self.assertEqual(call.call_args.args[0][-1], "EP99")
            self.assertNotIn("TimelineProbe-EP01", call.call_args.args[0][-2])

    def test_other_episode_with_and_without_notes(self):
        music = mixer.ROOT / "assets/bgm/EP01-preview.mp3"
        for notes_frames in (0, 60):
            with self.subTest(notes_frames=notes_frames), tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                audio = root / "public/audio/EP99"
                audio.mkdir(parents=True)
                episodes = root / "public/episodes"
                episodes.mkdir()
                config = {"music": str(music), "loopStartSec": 3, "loopPeriodSec": 4,
                          "crossfadeSec": 1, "quietShots": ["lecture-*"]}
                (episodes / "EP99.bgm.json").write_text(json.dumps(config))
                mixer.ffmpeg("-f", "lavfi", "-i", "sine=frequency=410:duration=10",
                             "-ar", mixer.RATE, "-ac", 2, audio / "voice.wav")
                shots = [{"id": "lecture-A", "audio": "voice.wav", "frames": 300,
                          "startFrame": 0, "leadSec": 0}]
                with patch.object(mixer, "ROOT", root), \
                     patch.object(mixer, "timeline", return_value=(30, shots, 300 + notes_frames)), \
                     patch.object(sys, "argv", ["mix_episode_bgm.py", "EP99", "--stem-only"]), \
                     contextlib.redirect_stdout(io.StringIO()):
                    mixer.main()
                self.assertTrue((audio / "bgm.mp3").is_file())
                self.assertFalse((root / "public/audio/EP01").exists())
                manifest = json.loads((root / "out/EP99-bgm/manifest.json").read_text())
                self.assertEqual(manifest["episode"], "EP99")
                self.assertEqual(manifest["stem_seconds"], 10 + notes_frames / 30)
                self.assertIn("lecture-A", manifest["metrics"])
                stem = mixer.decode(audio / "bgm.mp3")
                self.assertGreater(mixer.rms(stem), 0)


if __name__ == "__main__":
    unittest.main()
