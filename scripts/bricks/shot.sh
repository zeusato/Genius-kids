#!/usr/bin/env bash
# Chụp trang thử Xưởng Lắp Ghép bằng Chrome headless (hồ sơ tạm, không đụng hồ sơ thật).
# Dùng: bash scripts/bricks/shot.sh <ra.png> [query, mặc định demo=1] [rộng] [cao] [thư mục hồ sơ tạm]
# Hồ sơ tạm KHÔNG bị xoá tự động — đặt nó trong thư mục tạm/scratchpad.
out="$1"; q="${2:-demo=1}"; w="${3:-1180}"; h="${4:-820}"
prof="${5:-$(dirname "$out")/chrome-profile-$RANDOM$RANDOM}"
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --user-data-dir="$prof" --enable-webgl --ignore-gpu-blocklist \
  --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader --window-size="$w,$h" --virtual-time-budget=${BUDGET:-45000} \
  --screenshot="$out" "http://localhost:3000/Genius-kids/bricks-preview.html?$q" 2>/dev/null
