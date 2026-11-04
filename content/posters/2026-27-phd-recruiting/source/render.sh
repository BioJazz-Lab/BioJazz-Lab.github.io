C="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
cd "$(dirname "$0")"
"$C" --headless --disable-gpu --hide-scrollbars --virtual-time-budget=8000 --force-device-scale-factor=${SCALE:-1} --window-size=816,1056 --screenshot="$PWD/${OUT:-preview.png}" "file://$PWD/poster.html" 2>/dev/null
