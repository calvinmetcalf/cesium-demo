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
var sql = 'SELECT * FROM clientdemos.us_states';
var css = `#layer {
 polygon-fill: ramp([dec_spend], (#ffc6c4, #ee919b, #cc607d, #9e3963, #672044), quantiles);
polygon-opacity: 0.75;
 line-width: 1;
 line-color: #FFF;
 line-opacity: 0.5;
}`;
var interactivity = ['name', 'dec_spend'];
function genData(res) {
  var out = {};
  if (res.name) {
    out.name = res.name;
  }
  if (res.dec_spend && res.dec_spend.toLocaleString) {
    out.description = `cost is $${res.dec_spend.toLocaleString()}`;
  }
  return out;
}
cartoLayer(sql, css, interactivity, genData).then(l=> viewer.scene.imageryLayers.addImageryProvider(l)).catch(e=>console.log(e));
