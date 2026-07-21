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
  --offline-scan ^
  --skip-dirs "sop-po-tool/build,sop-po-tool/node_modules,sop-po-tool-be/target" ^
  --skip-files "*.map" ^
  --exit-code 0 ^
  --format table ^
  /src
