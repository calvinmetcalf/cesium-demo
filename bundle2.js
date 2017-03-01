(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
const username = 'clientdemos';
const SM = require('@mapbox/sphericalmercator');
const merc = new SM();
const R2D = 57.29577951308232088;
const uftDecode = c => {
  if (c >= 93) {
    c--;
  }
  if (c >= 35) {
    c--;
  }
  return c - 32;
}
class CartoLayer extends global.Cesium.UrlTemplateImageryProvider{
  constructor(username, layergroupid) {
    super({
      url: `https://${username}.carto.com/api/v1/map/${layergroupid}/{z}/{x}/{y}.png`,
      credit: 'cartodb',
      tileWidth: 256,
      tileHeight: 256,
      maximumLevel: 18,
      pickFeaturesUrl: `https://${username}.carto.com/api/v1/map/${layergroupid}/0/{z}/{x}/{y}.grid.json`,
      getFeatureInfoFormats: ['application/json'],
    });
    this.resolution = 4;
    this.tileSize = 256;
    this.username = username;
    this.layergroupid = layergroupid;
    this.rectangleScratch = new global.Cesium.Rectangle();
  }
  pickFeatures(x, y, level, _longitude, _latitude) {
    const longitude = R2D * _longitude;
    const latitude = R2D * _latitude;
    const url = `https://${this.username}.carto.com/api/v1/map/${this.layergroupid}/0/${level}/${x}/${y}.grid.json`;

    const px = merc.px([longitude, latitude], level);
    return fetch (url).then(resp=>{
      if (resp.status === 200) {
        return resp.json();
      }
      throw new Error(`expected 200 but got ${resp.status}`);
    }).then(data=>{
      var x = Math.floor(px[0]/this.tileSize);
      var y = Math.floor(px[1]/this.tileSize);
      var gridX = Math.floor((px[0] - (x * this.tileSize)) / this.resolution);
      var gridY = Math.floor((px[1] - (y * this.tileSize)) / this.resolution);
      var idx = uftDecode(data.grid[gridY].charCodeAt(gridX));
      const key = data.keys[idx];
      if (data.data.hasOwnProperty(key)) {
        var res = data.data[key];
        var out = {};
        if (res.clli) {
          out.name = res.clli;
        }
        return [out];
      }
      return [];
    }).catch(()=>[]);
  }
}
function makeCarto(){
  return fetch(`https://${username}.carto.com/api/v1/map`, {
    method: 'post',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(
      {
        version: '1.3.0',
        layers: [{
          type: 'mapnik',
          options: {
            cartocss_version: '2.1.1',
            sql: 'SELECT * FROM clientdemos.caf_buildout',
            cartocss: `#layer {
              marker-width: 12;
              marker-fill: #e7d810;
              marker-fill-opacity: 1;
              marker-allow-overlap: true;
              marker-line-width: 0.4;
              marker-line-color: #ffffff;
              marker-line-opacity: 1;
            }`,
            interactivity: ['clli']
          }
        }]
      })
  }).then(resp=>{
    if (resp.status === 200) {
      return resp.json();
    }
    throw new Error(`expected 200 but got ${resp.status}`);
  }).then(resp=>{
    return new CartoLayer(username, resp.layergroupid)
  })


}

module.exports=makeCarto;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"@mapbox/sphericalmercator":2}],2:[function(require,module,exports){
var SphericalMercator = (function(){

// Closures including constants and other precalculated values.
var cache = {},
    EPSLN = 1.0e-10,
    D2R = Math.PI / 180,
    R2D = 180 / Math.PI,
    // 900913 properties.
    A = 6378137.0,
    MAXEXTENT = 20037508.342789244;


// SphericalMercator constructor: precaches calculations
// for fast tile lookups.
function SphericalMercator(options) {
    options = options || {};
    this.size = options.size || 256;
    if (!cache[this.size]) {
        var size = this.size;
        var c = cache[this.size] = {};
        c.Bc = [];
        c.Cc = [];
        c.zc = [];
        c.Ac = [];
        for (var d = 0; d < 30; d++) {
            c.Bc.push(size / 360);
            c.Cc.push(size / (2 * Math.PI));
            c.zc.push(size / 2);
            c.Ac.push(size);
            size *= 2;
        }
    }
    this.Bc = cache[this.size].Bc;
    this.Cc = cache[this.size].Cc;
    this.zc = cache[this.size].zc;
    this.Ac = cache[this.size].Ac;
};

// Convert lon lat to screen pixel value
//
// - `ll` {Array} `[lon, lat]` array of geographic coordinates.
// - `zoom` {Number} zoom level.
SphericalMercator.prototype.px = function(ll, zoom) {
    var d = this.zc[zoom];
    var f = Math.min(Math.max(Math.sin(D2R * ll[1]), -0.9999), 0.9999);
    var x = Math.round(d + ll[0] * this.Bc[zoom]);
    var y = Math.round(d + 0.5 * Math.log((1 + f) / (1 - f)) * (-this.Cc[zoom]));
    (x > this.Ac[zoom]) && (x = this.Ac[zoom]);
    (y > this.Ac[zoom]) && (y = this.Ac[zoom]);
    //(x < 0) && (x = 0);
    //(y < 0) && (y = 0);
    return [x, y];
};

// Convert screen pixel value to lon lat
//
// - `px` {Array} `[x, y]` array of geographic coordinates.
// - `zoom` {Number} zoom level.
SphericalMercator.prototype.ll = function(px, zoom) {
    var g = (px[1] - this.zc[zoom]) / (-this.Cc[zoom]);
    var lon = (px[0] - this.zc[zoom]) / this.Bc[zoom];
    var lat = R2D * (2 * Math.atan(Math.exp(g)) - 0.5 * Math.PI);
    return [lon, lat];
};

// Convert tile xyz value to bbox of the form `[w, s, e, n]`
//
// - `x` {Number} x (longitude) number.
// - `y` {Number} y (latitude) number.
// - `zoom` {Number} zoom.
// - `tms_style` {Boolean} whether to compute using tms-style.
// - `srs` {String} projection for resulting bbox (WGS84|900913).
// - `return` {Array} bbox array of values in form `[w, s, e, n]`.
SphericalMercator.prototype.bbox = function(x, y, zoom, tms_style, srs) {
    // Convert xyz into bbox with srs WGS84
    if (tms_style) {
        y = (Math.pow(2, zoom) - 1) - y;
    }
    // Use +y to make sure it's a number to avoid inadvertent concatenation.
    var ll = [x * this.size, (+y + 1) * this.size]; // lower left
    // Use +x to make sure it's a number to avoid inadvertent concatenation.
    var ur = [(+x + 1) * this.size, y * this.size]; // upper right
    var bbox = this.ll(ll, zoom).concat(this.ll(ur, zoom));

    // If web mercator requested reproject to 900913.
    if (srs === '900913') {
        return this.convert(bbox, '900913');
    } else {
        return bbox;
    }
};

// Convert bbox to xyx bounds
//
// - `bbox` {Number} bbox in the form `[w, s, e, n]`.
// - `zoom` {Number} zoom.
// - `tms_style` {Boolean} whether to compute using tms-style.
// - `srs` {String} projection of input bbox (WGS84|900913).
// - `@return` {Object} XYZ bounds containing minX, maxX, minY, maxY properties.
SphericalMercator.prototype.xyz = function(bbox, zoom, tms_style, srs) {
    // If web mercator provided reproject to WGS84.
    if (srs === '900913') {
        bbox = this.convert(bbox, 'WGS84');
    }

    var ll = [bbox[0], bbox[1]]; // lower left
    var ur = [bbox[2], bbox[3]]; // upper right
    var px_ll = this.px(ll, zoom);
    var px_ur = this.px(ur, zoom);
    // Y = 0 for XYZ is the top hence minY uses px_ur[1].
    var x = [ Math.floor(px_ll[0] / this.size), Math.floor((px_ur[0] - 1) / this.size) ];
    var y = [ Math.floor(px_ur[1] / this.size), Math.floor((px_ll[1] - 1) / this.size) ];
    var bounds = {
        minX: Math.min.apply(Math, x) < 0 ? 0 : Math.min.apply(Math, x),
        minY: Math.min.apply(Math, y) < 0 ? 0 : Math.min.apply(Math, y),
        maxX: Math.max.apply(Math, x),
        maxY: Math.max.apply(Math, y)
    };
    if (tms_style) {
        var tms = {
            minY: (Math.pow(2, zoom) - 1) - bounds.maxY,
            maxY: (Math.pow(2, zoom) - 1) - bounds.minY
        };
        bounds.minY = tms.minY;
        bounds.maxY = tms.maxY;
    }
    return bounds;
};

// Convert projection of given bbox.
//
// - `bbox` {Number} bbox in the form `[w, s, e, n]`.
// - `to` {String} projection of output bbox (WGS84|900913). Input bbox
//   assumed to be the "other" projection.
// - `@return` {Object} bbox with reprojected coordinates.
SphericalMercator.prototype.convert = function(bbox, to) {
    if (to === '900913') {
        return this.forward(bbox.slice(0, 2)).concat(this.forward(bbox.slice(2,4)));
    } else {
        return this.inverse(bbox.slice(0, 2)).concat(this.inverse(bbox.slice(2,4)));
    }
};

// Convert lon/lat values to 900913 x/y.
SphericalMercator.prototype.forward = function(ll) {
    var xy = [
        A * ll[0] * D2R,
        A * Math.log(Math.tan((Math.PI*0.25) + (0.5 * ll[1] * D2R)))
    ];
    // if xy value is beyond maxextent (e.g. poles), return maxextent.
    (xy[0] > MAXEXTENT) && (xy[0] = MAXEXTENT);
    (xy[0] < -MAXEXTENT) && (xy[0] = -MAXEXTENT);
    (xy[1] > MAXEXTENT) && (xy[1] = MAXEXTENT);
    (xy[1] < -MAXEXTENT) && (xy[1] = -MAXEXTENT);
    return xy;
};

// Convert 900913 x/y values to lon/lat.
SphericalMercator.prototype.inverse = function(xy) {
    return [
        (xy[0] * R2D / A),
        ((Math.PI*0.5) - 2.0 * Math.atan(Math.exp(-xy[1] / A))) * R2D
    ];
};

return SphericalMercator;

})();

if (typeof module !== 'undefined' && typeof exports !== 'undefined') {
    module.exports = exports = SphericalMercator;
}

},{}],3:[function(require,module,exports){
(function (global){
'use strict';
var Cesium = global.Cesium;
Cesium.BingMapsApi.defaultKey = 'Agm7jjMfwbbyL5MdgJ7c6Uz0YFFlxi1Ks2Xt6PSPb8K9qpVfQGB3wZkBXPNyT-5S';
// Basemap
var cartoLayer = require('./carto-layer');
var viewer = new Cesium.Viewer('cesiumContainer', {
  baseLayerPicker: false,
  fullscreenButton: false,
  homeButton: false,
  timeline: false,
  navigationHelpButton: false,
  animation: false,
  scene3DOnly: true,
  geocoder: false
});
cartoLayer().then(l=> viewer.scene.imageryLayers.addImageryProvider(l)).catch(e=>console.log(e));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./carto-layer":1}]},{},[3]);
