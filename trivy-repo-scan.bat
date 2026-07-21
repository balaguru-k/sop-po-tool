@echo off
REM trivy-repo-scan.bat

echo === Running Trivy Repository Scan via Docker ===

IF NOT EXIST "%WORKSPACE%\.trivy-cache" mkdir "%WORKSPACE%\.trivy-cache"

docker run --rm ^
  -v /var/run/docker.sock:/var/run/docker.sock ^
  -v "%WORKSPACE%\.trivy-cache":/root/.cache ^
  -v "%WORKSPACE%":/src ^
  aquasec/trivy fs ^
  --scanners vuln,misconfig,secret ^
  --severity HIGH,CRITICAL ^
  --ignore-unfixed ^
  --exit-code 0 ^
  --format table ^
  /src
