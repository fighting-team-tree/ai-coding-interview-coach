param(
  [Parameter(Mandatory = $true)]
  [string]$PlanPath
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Speech

$plan = Get-Content -Raw -LiteralPath $PlanPath | ConvertFrom-Json
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer

try {
  if ($plan.voice) {
    $synth.SelectVoice([string]$plan.voice)
  }

  if ($null -ne $plan.rate) {
    $synth.Rate = [int]$plan.rate
  }

  if ($null -ne $plan.volume) {
    $synth.Volume = [int]$plan.volume
  }

  foreach ($cue in $plan.cues) {
    $outputPath = [string]$cue.outputPath
    $targetDir = Split-Path -Parent $outputPath

    if ($targetDir) {
      New-Item -ItemType Directory -Force -Path $targetDir | Out-Null
    }

    $synth.SetOutputToWaveFile($outputPath)
    $synth.Speak([string]$cue.text)
    $synth.SetOutputToNull()
  }
}
finally {
  $synth.Dispose()
}
