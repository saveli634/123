#!/bin/sh
# Lighthouse (мобильный профиль): sh scripts/lh.sh <url> <out.json>
CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome npx -y lighthouse@13 "$1" --quiet \
  --chrome-flags="--headless=new --no-sandbox --use-angle=swiftshader --enable-unsafe-swiftshader" \
  --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="$2" >/dev/null 2>&1
node -e "
const r=require('./$2');
console.log(Object.entries(r.categories).map(([k,v])=>k+' '+Math.round(v.score*100)).join(' | '));
console.log(['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index'].map(a=>a+' '+r.audits[a].displayValue).join(' | '));
"
