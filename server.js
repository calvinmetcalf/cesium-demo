'use strict';

const express = require('express');
const app = express();
const http = require('http').Server(app);
const path = require('path');
app.use(require('morgan')('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/cesium', express.static(path.join(__dirname, 'node_modules', 'cesium', 'Build', 'CesiumUnminified')));
const browserify = require('browserify-middleware');
browserify.settings({
  gzip: false
});
app.get('/bundle.js', browserify('index.js'));

http.listen(3000, function () {
  console.log('listening on port 3000');
})
