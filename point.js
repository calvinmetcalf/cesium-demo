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
var sql = 'SELECT * FROM clientdemos.caf_buildout';
var css = `#layer {
  marker-width: 12;
  marker-fill: #e7d810;
  marker-fill-opacity: 1;
  marker-allow-overlap: true;
  marker-line-width: 0.4;
  marker-line-color: #ffffff;
  marker-line-opacity: 1;
}`;
var interactivity = ['clli'];
function genData(res) {
  var out = {};
  if (res.clli) {
    out.name = res.clli;
  }
  return out;
}
cartoLayer(sql, css, interactivity, genData).then(l=> viewer.scene.imageryLayers.addImageryProvider(l)).catch(e=>console.log(e));
