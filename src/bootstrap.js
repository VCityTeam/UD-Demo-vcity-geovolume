/** @format */

import * as udvizBrowser from '@ud-viz/browser';
import { GeoVolumeModule } from './Extensions/GeoVolume/GeoVolumeModule';
import { SensorExtension } from './Extensions/Sensor/SensorExtension';
import { SparqlModule } from './Extensions/SPARQL/SparqlModule';

udvizBrowser.FileUtil.loadMultipleJSON([
  '../assets/config/all_widget.json',
  '../assets/config/extent_lyon.json',
  '../assets/config/frame3D_planars.json',
  '../assets/config/layer/base_maps.json',
  '../assets/config/layer/elevation.json',
  '../assets/config/widget/about.json',
  '../assets/config/widget/help.json',
  '../assets/config/widget/sparql_widget.json',
  '../assets/config/server/sparql_server.json',
  '../assets/config/server/geovolume_server.json',
  '../assets/config/styles.json',
]).then((configs) => {

  udvizBrowser.proj4.default.defs(
    configs['extent_lyon'].crs,
    '+proj=lcc +lat_1=45.25 +lat_2=46.75' +
      ' +lat_0=46 +lon_0=3 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
  );

  const extent = new udvizBrowser.itowns.Extent(
    configs['extent_lyon'].crs,
    parseInt(configs['extent_lyon'].west),
    parseInt(configs['extent_lyon'].east),
    parseInt(configs['extent_lyon'].south),
    parseInt(configs['extent_lyon'].north)
  );

  const app = new udvizBrowser.AllWidget(
    extent,
    configs['all_widget'],
    configs['frame3D_planars'][0]
  );

  const frame3DPlanar = app.getFrame3DPlanar();

  // udvizBrowser.addBaseMapLayer(
  //   configs['base_maps'][0],
  //   frame3DPlanar.itownsView,
  //   extent
  // );

  // udvizBrowser.addElevationLayer(
  //   configs['elevation'],
  //   frame3DPlanar.itownsView,
  //   extent
  // );

  const debug3dTilesWindow = new udvizBrowser.Widget.Debug3DTilesWindow(
    frame3DPlanar.getLayerManager()
  );
  app.addWidgetView('3dtilesDebug', debug3dTilesWindow, {
    name: '3DTiles Debug',
  });

  // //// LAYER CHOICE MODULE
  const layerChoice = new udvizBrowser.Widget.LayerChoice(
    frame3DPlanar.getLayerManager()
  );
  app.addWidgetView('layerChoice', layerChoice);

  const cityObjectProvider = new udvizBrowser.Widget.CityObjectProvider(
    frame3DPlanar.getLayerManager(),
    configs['styles']
  );

  // //// CITY OBJECTS MODULE
  const cityObjectModule = new udvizBrowser.Widget.CityObjectModule(
    cityObjectProvider,
    configs['styles']
  );
  app.addWidgetView('cityObjects', cityObjectModule.view);

  const geoVolumeModule = new GeoVolumeModule(configs['geovolume_server'], app);
  app.addWidgetView('geoVolume', geoVolumeModule.view);

  new SensorExtension(geoVolumeModule);

  ////// SPARQL MODULE
  new SparqlModule(
    configs['sparql_server'],
    frame3DPlanar.getLayerManager(),
    geoVolumeModule
  );
});
