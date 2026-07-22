@echo off
REM trivy-image-scan.bat

SET IMAGE_NAME=%~1
IF "%IMAGE_NAME%"=="" (
    echo [ERROR] No image name provided.
    exit /b 1
)

echo === Running Trivy Image Scan for: %IMAGE_NAME% ===

trivy image --severity CRITICAL --ignore-unfixed --exit-code 1 %IMAGE_NAME%

IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Trivy image scan failed for %IMAGE_NAME%!
    exit /b %ERRORLEVEL%
)
