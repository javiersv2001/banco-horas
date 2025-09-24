@echo off
REM -- Opcional: primera vez ejecutar npm install (comentar si ya instalaste)
if not exist "node_modules" (
  echo Instalando dependencias...
  npm install
)

echo Iniciando servidor...
start "" "cmd" /k "npm start"

REM Esperar 2 segundos y abrir Chrome en la URL del servidor
timeout /t 2 >nul
start "" "chrome" "http://localhost:3000"
exit
