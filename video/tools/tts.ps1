# 生成 public/audio/ 占位配音（Windows 自带 Huihui 中文语音）。
# 真声替换：录同名 wav 覆盖即可，时长自动重算（音频槽位架构）。
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Speech

$root = Split-Path -Parent $PSScriptRoot
$lines = Get-Content (Join-Path $root "public\lines.json") -Raw -Encoding UTF8 | ConvertFrom-Json
$outDir = Join-Path $root "public\audio"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(22050,
    [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen,
    [System.Speech.AudioFormat.AudioChannel]::Mono)

foreach ($l in $lines) {
    $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $s.SelectVoice("Microsoft Huihui Desktop")
    $s.Rate = 1
    $s.SetOutputToWaveFile((Join-Path $outDir $l.file), $fmt)
    $s.Speak($l.tts)
    $s.Dispose()
    Write-Output ("OK  " + $l.file)
}
Write-Output "done -> public\audio\"
