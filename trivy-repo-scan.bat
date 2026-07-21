@echo off
REM trivy-repo-scan.bat
REM Scans source code, dependencies, IaC misconfigurations, and secrets

echo === Running Trivy Repository Scan ===

trivy fs ^
  --scanners vuln,misconfig,secret ^
  --severity HIGH,CRITICAL ^
  --ignore-unfixed ^
  --exit-code 0 ^
  --format table ^
  .
