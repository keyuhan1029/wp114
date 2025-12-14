#!/bin/bash
cd /Users/keyuhan/Desktop/wp114/NTUGo
echo "检查 Node.js 版本..."
node -v
npm -v
echo ""
echo "开始 npm install..."
npm install 2>&1 | tee install.log
echo ""
echo "安装完成，检查退出码: $?"

