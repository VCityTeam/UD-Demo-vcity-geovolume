/** @format */

import * as udviz from 'ud-viz';
import proj4 from 'proj4';
import { GeoVolumeSource } from './Extensions/GeoVolumeWidget/GeoVolume/GeoVolumeSource';
import { GeoVolumeWindow } from './Extensions/GeoVolumeWidget/GeoVolumeWindow';

const app = new udviz.Templates.AllWidget();

proj4.defs(
  'EPSG:3946',
  '+proj=lcc +lat_1=45.25 +lat_2=46.75' +
  ' +lat_0=46 +lon_0=3 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
);

app.start('../assets/config/config.json').then((config) => {


  ////// LAYER CHOICE MODULE
  const layerChoice = new udviz.Widgets.LayerChoice(app.view3D.layerManager);
  app.addModuleView('layerChoice', layerChoice);



  ////// CITY OBJECTS MODULE
  let cityObjectModule = new udviz.Widgets.CityObjectModule(
    app.view3D.layerManager,
    app.config
  );
  app.addModuleView('cityObjects', cityObjectModule.view);
  


  ////// 3DTILES DEBUG
  const debug3dTilesWindow = new udviz.Widgets.Debug3DTilesWindow(
    app.view3D.layerManager
  );
  app.addModuleView('3dtilesDebug', debug3dTilesWindow, {
    name: '3DTiles Debug',
  });


  const geoVolumeSource = new GeoVolumeSource({
    extent: app.extent,
    crs: app.extent.crs,
    name: 'geoVolumeSource',
    url: 'http://localhost:3000/collections/',
  },
  app.view);

  const geoVolumeWindow = new GeoVolumeWindow(geoVolumeSource,app);
  app.addModuleView('geoVolume',geoVolumeWindow);

});
