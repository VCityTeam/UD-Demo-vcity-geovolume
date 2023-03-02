import { Widget } from '@ud-viz/browser';

export class CityObjectProviderPatch extends Widget.CityObjectProvider {

  constructor(layerManager) {
    super(layerManager);
  }

  selectCityObjectByBatchTable(key, value) {
    let tileManagerAndCityObject = this.pickCityObjectByBatchTable(key, value);
    if (tileManagerAndCityObject) {
      let cityObject = tileManagerAndCityObject[1]
      if (this.selectedCityObject != cityObject) {
        if (this.selectedCityObject) {
          this.sendEvent(
            Widget.CityObjectProvider.EVENT_CITY_OBJECT_CHANGED,
            cityObject
          );
          this.unselectCityObject();
        } else {
          this.sendEvent(
            Widget.CityObjectProvider.EVENT_CITY_OBJECT_SELECTED,
            cityObject
          );
        }
        this.selectedCityObject = cityObject;
        this.selectedTilesManager = this.layerManager.getTilesManagerByLayerID(
          this.selectedCityObject.tile.layer.id
        );
        this.selectedStyle =
          this.selectedTilesManager.styleManager.getStyleIdentifierAppliedTo(
            this.selectedCityObject.cityObjectId
          );
        this.selectedTilesManager.setStyle(
          this.selectedCityObject.cityObjectId,
          'selected'
        );
        this.selectedTilesManager.applyStyles({
          updateFunction: this.selectedTilesManager.view.notifyChange.bind(
            this.selectedTilesManager.view
          ),
        });
        this.removeLayer();
      }
    }
  }

  pickCityObjectByBatchTable(batchTableKey, batchTableValue) {
    for (let tilesManager of this.layerManager.tilesManagers) {
      if (tilesManager.tiles){
        for (let tile of tilesManager.tiles) {
          if (tile){
            if (tile.cityObjects && tile.batchTable) {
              if (tile.batchTable.content[batchTableKey]) {
                if (tile.batchTable.content[batchTableKey].includes(batchTableValue)){
                  return [tilesManager,tile.cityObjects[tile.batchTable.content[batchTableKey].indexOf(batchTableValue)]];
                }
              }
            }
          }
        }
      }
    }
    console.warn('WARNING: cityObject not found with key, value pair: ' + batchTableKey + ', ' + batchTableValue);
    return undefined;
  }
}