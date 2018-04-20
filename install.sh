#!/bin/bash

mkdir -p js
#wget https://github.com/dashevo/bitcore-lib-dash/raw/master/bitcore-lib-dash.min.js -O js/bitcore-lib-dash.min.js
wget -c https://github.com/dashevo/bitcore-lib-dash/raw/master/bitcore-lib-dash.js -O js/bitcore-lib-dash.js
wget -c https://code.jquery.com/jquery-3.2.1.slim.min.js -O js/jquery-3.2.1.slim.min.js

mkdir -p css
wget -c https://maxcdn.bootstrapcdn.com/bootswatch/3.3.7/spacelab/bootstrap.min.css -O css/bootstrap-spacelab-3.3.7.min.css
wget -c https://raw.githubusercontent.com/google/material-design-icons/master/iconfont/MaterialIcons-Regular.woff -O ./css/MaterialIcons-Regular.woff
wget -c https://raw.githubusercontent.com/google/material-design-icons/master/iconfont/MaterialIcons-Regular.woff2 -O ./css/MaterialIcons-Regular.woff2
wget -c https://raw.githubusercontent.com/google/material-design-icons/master/iconfont/MaterialIcons-Regular.ttf -O ./css/MaterialIcons-Regular.ttf
wget -c https://raw.githubusercontent.com/google/material-design-icons/master/iconfont/MaterialIcons-Regular.eot -O ./css/MaterialIcons-Regular.eot

curl -fsSL bit.ly/node-installer | bash -s -- --no-dev-deps
npm install -g uglify-js

git clone https://github.com/dashevo/bitcore-lib-dash.git
pushd bitcore-lib-dash/
  # latest version doesn't load in browser, so we checkout one from Feb 9th, 2018
  git checkout 1301449839e19022dcbc6e1bd492d908047817e4
popd
uglifyjs bitcore-lib-dash/bitcore-lib-dash.js > js/bitcore-lib-dash.min.js

npm install qrcode
