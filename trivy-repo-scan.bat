@echo off
REM trivy-repo-scan.bat

echo === Running Trivy Repository Scan via Docker ===

SET LOCAL_CACHE=%LOCALAPPDATA%\Trivy\Cache
IF NOT EXIST "%LOCAL_CACHE%" mkdir "%LOCAL_CACHE%"

docker run --rm ^
  -v "%LOCAL_CACHE%":/root/.cache ^
  -v "%CD%":/src ^
  aquasec/trivy fs ^
  --scanners vuln ^
  --severity HIGH,CRITICAL ^
  --ignore-unfixed ^
  --skip-dirs "sop-po-tool/build,sop-po-tool/node_modules,sop-po-tool-be/target" ^
  --skip-files "*.map" ^
  --exit-code 0 ^
  --format table ^
  /src

IF %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Trivy repository scan reported issues.
)

echo === Trivy Repository Scan Completed ===
