@echo off
REM trivy-image-scan.bat

SET IMAGE_NAME=%~1
IF "%IMAGE_NAME%"=="" (
    echo [ERROR] No image name provided.
    exit /b 1
)

echo === Running Trivy Scan for: %IMAGE_NAME% via Docker ===

IF NOT EXIST "%WORKSPACE%\.trivy-cache" mkdir "%WORKSPACE%\.trivy-cache"

docker run --rm ^
  -v /var/run/docker.sock:/var/run/docker.sock ^
  -v "%WORKSPACE%\.trivy-cache":/root/.cache ^
  aquasec/trivy image ^
  --severity HIGH,CRITICAL ^
  --ignore-unfixed ^
  --exit-code 1 ^
  --format table ^
  "%IMAGE_NAME%"
