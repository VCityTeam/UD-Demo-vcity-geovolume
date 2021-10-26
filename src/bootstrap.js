/** @format */

import * as udviz from 'ud-viz';
import { TilesManager } from 'ud-viz/src/Components/Components';
import { IfcAttributeModule } from './Extensions/IfcAttributeModule/IfcAttributeModule';
import { GeoVolumeSource } from './Extensions/GeoVolumeModule/GeoVolume/GeoVolumeSource';


const app = new udviz.Templates.AllWidget();

function registerIfcStyle(tilesmanager) {
  tilesmanager.registerStyle('Wall', {
    materialProps: { opacity: 1, color: 0xfcf8c9 },
  });
  tilesmanager.registerStyle('Window', {
    materialProps: { opacity: 0.6, color: 0x36b9d6 },
  });
  tilesmanager.registerStyle('Pipe', {
    materialProps: { opacity: 1, color: 0xff7f50 },
  });
  tilesmanager.registerStyle('Duct', {
    materialProps: { opacity: 1, color: 0xadd8e6 },
  });
}

function getIfcStyleByClass(ifcClass) {
  if (ifcClass.includes('Pipe')) {
    return 'Pipe';
  }
  if (ifcClass.includes('Duct')) {
    return 'Duct';
  }
  if (
    ifcClass == 'IfcWall' ||
    ifcClass.includes('Stair') ||
    ifcClass == 'IfcSlab'
  ) {
    return 'Wall';
  }
  if (ifcClass == 'IfcWindow') {
    return 'Window';
  }
  return undefined;
}

function setIfcStyles(layerManager, layerIFC) {
  if (layerManager.getTilesManagerByLayerID(layerIFC) != undefined) {
    let tilesmanager = layerManager.getTilesManagerByLayerID(layerIFC);
    tilesmanager.layer.isIfcLayer = true;
    registerIfcStyle(tilesmanager);
    tilesmanager.addEventListener(
      TilesManager.EVENT_TILE_LOADED,
      function () {
        for (let j = 0; j < tilesmanager.tiles.length; j++) {
          if (tilesmanager.tiles[j] != undefined) {
            if (tilesmanager.tiles[j].cityObjects != undefined) {
              for (
                let k = 0;
                k < tilesmanager.tiles[j].cityObjects.length;
                k++
              ) {
                let style = getIfcStyleByClass(
                  getIfcClasse(tilesmanager.tiles[j].cityObjects[k])
                );
                if (style != undefined) {
                  tilesmanager.setStyle(
                    tilesmanager.tiles[j].cityObjects[k].cityObjectId,
                    style
                  );
                }
              }
              tilesmanager.applyStyleToTile(tilesmanager.tiles[j].tileId, {
                updateFunction: tilesmanager.view.notifyChange.bind(
                  tilesmanager.view
                ),
              });
              tilesmanager.view.notifyChange();
            }
          }
        }
      }
    );
  }
}

function getIfcClasse(cityObject) {
  return cityObject.tile.batchTable.content.classe[cityObject.batchId];
}

app.start('../assets/config/config.json').then((config) => {
  app.addBaseMapLayer();

  app.addElevationLayer();

  app.setupAndAdd3DTilesLayers();

  for (let layer of config['3DTilesLayers']) {
    if (layer['ifc']) {
      setIfcStyles(app.layerManager, layer['id']);
      
    }
  }
  ////// LAYER CHOICE MODULE
  const layerChoice = new udviz.Widgets.LayerChoice(app.layerManager);
  app.addModuleView('layerChoice', layerChoice);



  ////// CITY OBJECTS MODULE
  let cityObjectModule = new udviz.Widgets.CityObjectModule(
    app.layerManager,
    app.config
  );
  app.addModuleView('cityObjects', cityObjectModule.view);
  
  new IfcAttributeModule(cityObjectModule); 


  ////// 3DTILES DEBUG
  const debug3dTilesWindow = new udviz.Widgets.Extensions.Debug3DTilesWindow(
    app.layerManager
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
});
