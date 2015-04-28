#!/bin/sh

version="0.3.0"
tempDir=".build"

rm -rf ${tempDir}
mkdir -p ${tempDir}
cd ${tempDir}
wget https://github.com/IjzerenHein/famous-flex/archive/v${version}.tar.gz
tar xfvz v${version}.tar.gz
cd famous-flex-${version}
npm install
npm run-script global-no-famous
# https://github.com/IjzerenHein/famous-flex/commit/ef168a8753668b41204d3ab3d3677a9b041e496f
cp ./dist/famous-flex-global.js ../../lib/flex-scrollview.js
cd -
cd -
