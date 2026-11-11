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
echo   正在启动开发服务（API + 网页）
echo ==========================================
echo.

if not exist node_modules (
  echo [1/2] 首次运行，正在安装依赖，请稍候...
  call npm install
  if errorlevel 1 goto error
) else (
  echo [1/2] 依赖已就绪
)

echo [2/2] 启动服务...
echo.
echo   网页地址：http://127.0.0.1:5000
echo   后台地址：http://127.0.0.1:5000/admin
echo.
echo   关闭本窗口即可停止服务。
echo.

start "" cmd /c "timeout /t 6 >nul & start http://127.0.0.1:5000"
call npm run dev
goto end

:error
echo.
echo 启动失败：请确认已安装 Node.js 18+，并且当前目录有 package.json。
pause

:end
