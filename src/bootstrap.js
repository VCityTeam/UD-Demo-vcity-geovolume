/** @format */

import * as udvizBrowser from "@ud-viz/browser";
import { GeoVolumeModule } from "./Extensions/GeoVolume/GeoVolumeModule";
import { SensorExtension } from "./Extensions/Sensor/SensorExtension";
import { SparqlQueryWindow } from "./Extensions/SPARQL/SparqlQueryWindow";
import css from "./style.css";
import { ScaleWidget } from "./Extensions/Scale/ScaleWidget";
import { MyScaleWidget } from "./Extensions/MyScale/MyScaleWidget";
import {
  loadJSON,
  computeFileNameFromPath,
} from "@ud-viz/browser/src/FileUtil";


function loadMultipleJSON(urlArray) {
  return new Promise((resolve, reject) => {
    const promises = [];
    const result = {};

    urlArray.forEach((url) => {
      promises.push(
        loadJSON(url).then((jsonResult) => {
          const key = computeFileNameFromPath(url);
          if (result[key]) throw new Error("conflict same key");
          result[key] = jsonResult;
        })
      );
    });

    Promise.all(promises)
      .then(() => {
        resolve(result);
      })
      .catch(reject);
  });
}

loadMultipleJSON([
  "../assets/config/scene.json",
  "../assets/config/layer/elevation.json",
  "../assets/config/extent_lyon.json",
  "../assets/config/frame3D_planars.json",
  "../assets/config/layer/base_maps.json",
  "../assets/config/widget/about.json",
  "../assets/config/widget/help.json",
  "../assets/config/widget/sparql_widget.json",
  "../assets/config/server/sparql_server.json",
  "../assets/config/server/geovolume_server.json",
  "../assets/config/styles.json",
  "../assets/config/layer/3DTiles.json",
]).then((configs) => {
  // udvizBrowser.proj4.default.defs(
  //   "EPSG:3946",
  //   "+proj=lcc +lat_1=45.25 +lat_2=46.75" +
  //     " +lat_0=46 +lon_0=3 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"
  // );

  udvizBrowser.proj4.default.defs(
    "EPSG:3946",
    "+proj=lcc +lat_0=46 +lon_0=3 +lat_1=45.25 +lat_2=46.75 +x_0=1700000 +y_0=5200000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs"
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

  // ADD BASE MAP
  udvizBrowser.addBaseMapLayer(
    configs["base_maps"][0],
    frame3DPlanar.itownsView,
    extent
  );

  udvizBrowser.addElevationLayer(
    configs["elevation"],
    frame3DPlanar.itownsView,
    extent
  );

  // let extensions = new udvizBrowser.itowns.C3DTExtensions();

  //       extensions.registerExtension('3DTILES_batch_table_hierarchy', {
  //         [udvizBrowser.itowns.C3DTilesTypes.batchtable]:
  //         udvizBrowser.itowns.C3DTBatchTableHierarchyExtension,
  //       });

  // const test = new udvizBrowser.itowns.C3DTilesLayer(
  //   "test",
  //   {
  //     name: "test",
  //     source: new udvizBrowser.itowns.C3DTilesSource({
  //       url: "../assets/layer/ifc_tileset/tileset.json",
  //     }),
  //     registeredExtensions: extensions,
  //   },
  //   frame3DPlanar.itownsView
  // );

  // udvizBrowser.itowns.View.prototype.addLayer.call(
  //   frame3DPlanar.itownsView,
  //   test
  // );

  const geoVolumeModule = new GeoVolumeModule(
    configs["geovolume_server"],
    frame3DPlanar
  );

  const sparqlWidget = new SparqlQueryWindow(
    new udvizBrowser.Widget.Server.SparqlEndpointResponseProvider(
      configs["sparql_server"]
    ),
    frame3DPlanar,
    configs["sparql_widget"],
    geoVolumeModule.view
  );

  // const scaleWidget = new ScaleWidget(geoVolumeModule.view,frame3DPlanar);
  // const MyscaleWidget = new MyScaleWidget(geoVolumeModule.view,frame3DPlanar);

  // //// LAYER CHOICE MODULE
  // const layerChoice = new udvizBrowser.Widget.LayerChoice(
  //   frame3DPlanar.itownsView
  // );

  // const parent = document.createElement('div');
  // parent.style.backgroundColor = 'white';
  // parent.style.width = 'fit-content';
  // parent.style.position = 'absolute';
  // parent.style.bottom = '0px';

  // parent.style.zIndex = 2;
  // parent.appendChild(layerChoice.domElement);

  // frame3DPlanar.domElementUI.appendChild(parent);

  // new SensorExtension(geoVolumeModule, configs["sensor_server"], app.frame3DPlanar);
});
