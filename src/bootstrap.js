/** @format */

import * as udvizBrowser from '@ud-viz/browser';
import { GeoVolumeModule } from './Extensions/GeoVolume/GeoVolumeModule';
import { SensorExtension } from './Extensions/Sensor/SensorExtension';
// import { SparqlModule } from './Extensions/SPARQL/SparqlModule';

udvizBrowser.FileUtil.loadMultipleJSON([
  '../assets/config/scene.json',
  '../assets/config/extent_lyon.json',
  '../assets/config/frame3D_planars.json',
  '../assets/config/layer/base_maps.json',
  '../assets/config/layer/elevation.json',
  '../assets/config/widget/about.json',
  '../assets/config/widget/help.json',
  '../assets/config/widget/sparql_widget.json',
  '../assets/config/server/sparql_server.json',
  '../assets/config/server/geovolume_server.json',
  '../assets/config/server/sensor_server.json',
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

  const app = new udvizBrowser.SideBarWidget(
    extent,
    configs['frame3D_planars'][0],
    configs['scene']
  );

  app.addLogos([
    './assets/img/logo-BL.jpg',
    './assets/img/logo-liris.png',
    './assets/img/logo-univ-lyon.png',
    './assets/img/cnrs.png'
  ]);

  app.addLayers({
    elevation: configs['elevation'],
    baseMap: configs['base_maps'][0]
  });

  app.addWidgetCityObject(
    configs['styles'],
    './assets/icons/cityObjects.svg'
  );

  app.addWidgetDebug3DTiles('./assets/icons/3dtilesDebug.svg');

  app.addWidgetLayerChoice('./assets/icons/layerChoice.svg');


  // const frame3DPlanar = app.frame3DPlanar;
 
  const geoVolumeModule = new GeoVolumeModule(configs['geovolume_server'], app);
  const sideBarButton = document.createElement('img');
  sideBarButton.src = "./assets/icons/geoVolume.svg";
  app.menuSideBar.appendChild(sideBarButton);

  sideBarButton.onclick = () => {
    if (geoVolumeModule.view.html().parentElement) {
      app.panMenuSideBar.remove(geoVolumeModule.view.html());
      geoVolumeModule.view.dispose();
      sideBarButton.classList.remove(
        '_sidebar_widget_menu_sidebar_img_selected'
      );
    } else {
      app.panMenuSideBar.add(
        'GeoVolume',
        geoVolumeModule.view.html()
      );
      geoVolumeModule.view.addListenerTo(app.frame3DPlanar.rootWebGL);
      sideBarButton.classList.add(
        '_sidebar_widget_menu_sidebar_img_selected'
      );
    }
  };

  new SensorExtension(geoVolumeModule,configs["sensor_server"]);

  ////// SPARQL MODULE
  // new SparqlModule(
  //   configs['sparql_server'],
  //   frame3DPlanar.getLayerManager(),
  //   geoVolumeModule
  // );
});
