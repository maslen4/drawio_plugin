@ECHO OFF
set "SCRIPT_DIR=%~dp0"
del "C:\Users\kupor\AppData\Roaming\draw.io\plugins\customAnimation.js"
del "C:\Users\kupor\AppData\Roaming\draw.io\plugins\generateCustomAnim.js"

draw.io --enable-plugins

