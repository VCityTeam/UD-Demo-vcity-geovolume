/** @format */

import * as udvizBrowser from "@ud-viz/browser";
import { GeoVolumeModule } from "./Extensions/GeoVolume/GeoVolumeModule";
import { SensorExtension } from "./Extensions/Sensor/SensorExtension";
// import { SparqlModule } from './Extensions/SPARQL/SparqlModule';

udvizBrowser.loadMultipleJSON([
  "../assets/config/scene.json",
  "../assets/config/extent_lyon.json",
  "../assets/config/frame3D_planars.json",
  "../assets/config/layer/base_maps.json",
  "../assets/config/layer/elevation.json",
  "../assets/config/widget/about.json",
  "../assets/config/widget/help.json",
  "../assets/config/widget/sparql_widget.json",
  "../assets/config/server/sparql_server.json",
  "../assets/config/server/geovolume_server.json",
  "../assets/config/styles.json",
]).then((configs) => {
  udvizBrowser.proj4.default.defs(
    "EPSG:3946",
    "+proj=lcc +lat_1=45.25 +lat_2=46.75" +
      " +lat_0=46 +lon_0=3 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
  );

  const extent = new udvizBrowser.itowns.Extent(
    configs["extent_lyon"].crs,
    parseInt(configs["extent_lyon"].west),
    parseInt(configs["extent_lyon"].east),
    parseInt(configs["extent_lyon"].south),
    parseInt(configs["extent_lyon"].north)
  );

  const frame3DPlanar = new udvizBrowser.Frame3DPlanar(
    extent,
    configs["frame3D_planars"][0]
  );

  // app.addLogos([
  //   "./assets/img/logo-BL.jpg",
  //   "./assets/img/logo-liris.png",
  //   "./assets/img/logo-univ-lyon.png",
  //   "./assets/img/cnrs.png",
  // ]);

  // ADD BASE MAP
  udvizBrowser.addBaseMapLayer(
    configs["base_maps"][0],
    frame3DPlanar.itownsView,
    extent
  );

  // ADD ELEVATION LAYER
  udvizBrowser.addElevationLayer(
    configs["elevation"],
    frame3DPlanar.itownsView,
    extent
  );

  const geoVolumeModule = new GeoVolumeModule(configs["geovolume_server"], frame3DPlanar);

  // new SensorExtension(geoVolumeModule, configs["sensor_server"], app.frame3DPlanar);

  ////// SPARQL MODULE
  // new SparqlModule(
  //   configs['sparql_server'],
  //   frame3DPlanar.getLayerManager(),
  //   geoVolumeModule
  // );
});
