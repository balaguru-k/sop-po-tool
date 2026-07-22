@echo off
REM trivy-image-scan.bat

SET BACKEND_IMAGE=%~1
SET FRONTEND_IMAGE=%~2

IF "%BACKEND_IMAGE%"=="" (
    echo [ERROR] No backend image provided.
    exit /b 1
)

SET TRIVY_CACHE_DIR=C:\ProgramData\TrivyCache
IF NOT EXIST "%TRIVY_CACHE_DIR%" mkdir "%TRIVY_CACHE_DIR%"

echo === Running Trivy Scan for Backend: %BACKEND_IMAGE% ===
trivy image ^
  --cache-dir "%TRIVY_CACHE_DIR%" ^
  --scanners vuln ^
  --severity CRITICAL ^
  --ignore-unfixed ^
  --exit-code 0 ^
  "%BACKEND_IMAGE%"

IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Trivy image scan failed for %BACKEND_IMAGE%!
    exit /b %ERRORLEVEL%
)

IF NOT "%FRONTEND_IMAGE%"=="" (
    echo === Running Trivy Scan for Frontend: %FRONTEND_IMAGE% ===
    trivy image ^
      --cache-dir "%TRIVY_CACHE_DIR%" ^
      --scanners vuln ^
      --severity CRITICAL ^
      --ignore-unfixed ^
      --exit-code 0 ^
      "%FRONTEND_IMAGE%"

    IF %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Trivy image scan failed for %FRONTEND_IMAGE%!
        exit /b %ERRORLEVEL%
    )
)

echo === Trivy Image Scans Completed Successfully ===
