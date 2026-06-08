@echo off
REM Auto push changes to GitHub

git add .
git commit -m "Auto Update"
git push origin main

echo.
echo Auto push complete.
