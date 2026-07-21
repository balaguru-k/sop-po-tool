@echo off
REM trivy-repo-scan.bat

echo === Running Trivy Repository Scan via Docker ===

docker run --rm ^
  -v /var/run/docker.sock:/var/run/docker.sock ^
  -v "%LOCALAPPDATA%\Trivy\Cache":/root/.cache ^
  -v "%WORKSPACE%":/src ^
  aquasec/trivy fs ^
  --scanners vuln,misconfig,secret ^
  --severity HIGH,CRITICAL ^
  --ignore-unfixed ^
  --exit-code 0 ^
  --format table ^
  /src
