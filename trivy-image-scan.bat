@echo off
REM trivy-image-scan.bat
REM Usage: trivy-image-scan.bat <image-name:tag>

SET IMAGE_NAME=%~1
IF "%IMAGE_NAME%"=="" (
    echo [ERROR] No image name provided.
    exit /b 1
)

echo === Running Trivy Scan for: %IMAGE_NAME% ===

trivy image ^
  --severity HIGH,CRITICAL ^
  --ignore-unfixed ^
  --exit-code 1 ^
  --format table ^
  "%IMAGE_NAME%"
