@echo off
setlocal
REM Windows-friendly entry: cmd is always available; logs whether node is on PATH.
set "HOOK_DIR=%~dp0"
set "LOG=%HOOK_DIR%format-after-edit.log"
set "ROOT=%HOOK_DIR%..\.."

echo [%DATE% %TIME%] start cwd=%CD%>> "%LOG%"

where node >nul 2>&1
if errorlevel 1 (
  echo [%DATE% %TIME%] ERROR: node not found on PATH>> "%LOG%"
  exit /b 0
)

node "%HOOK_DIR%format-after-edit.mjs"
set "EC=%ERRORLEVEL%"
echo [%DATE% %TIME%] node exit=%EC%>> "%LOG%"
exit /b 0
