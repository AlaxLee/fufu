# build.ps1 - Simple build: installer + portable (fixed args)

$ErrorActionPreference = 'Stop'

# Switch to script directory
Set-Location -Path $PSScriptRoot

# Resolve npm.cmd path
$npmCmd = $null
try {
  $npmCmd = (Get-Command npm.cmd -ErrorAction Stop).Source
} catch {
  try { $npmCmd = (Get-Command npm -ErrorAction Stop).Source }
  catch {
    Write-Error "npm not found. Please install Node.js and ensure npm is in PATH."
    exit 1
  }
}

function Invoke-Npm {
  param([Parameter(Mandatory=$true)][string[]]$CmdArgs)
  Write-Host (">> " + (Split-Path -Leaf $npmCmd) + " " + ($CmdArgs -join ' '))
  & $npmCmd @CmdArgs
  if ($LASTEXITCODE -ne 0) {
    throw ("npm command failed: " + ($CmdArgs -join ' '))
  }
}

Write-Host "Installing dependencies..."
Invoke-Npm @('install')

Write-Host "Building (installer + portable)..."
Invoke-Npm @('run','build')

$dist = Join-Path $PSScriptRoot 'dist'
Write-Host ("Build finished. Artifacts at: " + $dist)
if (Test-Path $dist) {
  Start-Process explorer.exe $dist
}