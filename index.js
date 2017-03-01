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
