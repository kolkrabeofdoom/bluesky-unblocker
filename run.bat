@echo off
title Bluesky Block-Entferner
echo ==================================================
echo   Starte Bluesky Block-Entferner Server...
echo ==================================================
echo.

:: Open the browser first to prepare
start "" "http://localhost:3000"

:: Start the server. This blocks and keeps the window open.
node server.js

if %errorlevel% neq 0 (
    echo.
    echo Ein Fehler ist aufgetreten beim Starten des Servers.
    echo Ist Node.js installiert und auf deinem PATH vorhanden?
    echo.
    pause
)
