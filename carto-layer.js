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
  constructor(username, layergroupid, generateData) {
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
    this.generateData = generateData;
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
        return [this.generateData(data.data[key])];
      }
      return [];
    }).catch(()=>[]);
  }
}
function makeCarto(sql, css, interactivity, generateData){
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
            sql: sql,
            cartocss: css,
            interactivity: interactivity
          }
        }]
      })
  }).then(resp=>{
    if (resp.status === 200) {
      return resp.json();
    }
    throw new Error(`expected 200 but got ${resp.status}`);
  }).then(resp=>{
    return new CartoLayer(username, resp.layergroupid, generateData)
  })


}

module.exports=makeCarto;
