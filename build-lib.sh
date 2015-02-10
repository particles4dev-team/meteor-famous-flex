#!/bin/sh

version="0.1.9"
tempDir=".build"

rm -rf ${tempDir}
mkdir -p ${tempDir}
cd ${tempDir}
wget https://github.com/IjzerenHein/famous-flex/archive/v${version}.tar.gz
tar xfvz v${version}.tar.gz
cd famous-flex-${version}
npm install
npm run-script global-no-famous
cp global-no-famous.js ../../lib/flex-scrollview.js
cd -
cd -
