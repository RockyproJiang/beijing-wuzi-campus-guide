@echo off
chcp 65001 >nul
cd /d "%~dp0"

powershell -NoProfile -Command "if (Get-NetTCPConnection -LocalPort 5000 -State Listen -ErrorAction SilentlyContinue) { exit 0 } else { exit 1 }"
if not errorlevel 1 (
  echo 检测到 5000 端口已有服务在运行，直接打开浏览器。
  start "" http://127.0.0.1:5000
  exit /b
)

echo ==========================================
echo   北京物资学院 · 校园指南
echo   生产模式（构建后由 Node 同端口托管）
echo ==========================================
echo.

if not exist node_modules (
  echo 正在安装依赖...
  call npm install
  if errorlevel 1 goto error
)

echo 正在构建前端...
call npm run build
if errorlevel 1 goto error

echo 正在启动服务...
start "" cmd /c "timeout /t 3 >nul & start http://127.0.0.1:5000"
call npm start
goto end

:error
echo.
echo 构建或启动失败，请查看上方日志。
pause

:end
