@echo off
REM trivy-repo-scan.bat

echo === Running Trivy Repository Scan ===

SET TRIVY_CACHE_DIR=C:\ProgramData\TrivyCache
IF NOT EXIST "%TRIVY_CACHE_DIR%" mkdir "%TRIVY_CACHE_DIR%"

trivy fs . ^
  --cache-dir "%TRIVY_CACHE_DIR%" ^
  --scanners vuln ^
  --severity HIGH,CRITICAL ^
  --ignore-unfixed ^
  --skip-dirs "sop-po-tool/build,sop-po-tool/node_modules,sop-po-tool-be/target" ^
  --skip-files "*.map" ^
  --exit-code 0 ^
  --format table

IF %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Trivy repository scan reported issues.
)

echo === Trivy Repository Scan Completed ===
