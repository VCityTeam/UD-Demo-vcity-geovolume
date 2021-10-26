import { Source } from 'itowns';
import * as jquery from 'jquery';
import { MAIN_LOOP_EVENTS } from 'itowns';
import { GeoVolume } from './GeoVolume';

/**
 * const geoVolumeSource = new GeoVolumesource({
 *     url: 'http://dummy.fr/',
 *     crs: 'EPSG:4326',
 *     extent: {
 *         west: 4.568,
 *         east: 5.18,
 *         south: 45.437,
 *         north: 46.03,
 *     },
 *     format: 'application/json'
 * });
 */

export class GeoVolumeSource extends Source {
  /**
   * @param {Object} source - An object that can contain all properties of a
   * geoVolumeSource and {@link Source}.
   *
   * @constructor
   */
  constructor(source,itownsView) {
    super(source);

    this.isGeoVolumeSource = true;
    this.itownsView = itownsView;

    // Request update every active frame
    this.itownsView.addFrameRequester(
      MAIN_LOOP_EVENTS.AFTER_CAMERA_UPDATE,
      () => this.getGeovolumesFromExtent()
    );

    this.url = `${source.url}`;

    /**
     * Array of geovolumes
     */
    this.collection = new Array();

    this.loadCollection();
  }

  getGeovolumesFromExtent(){
    let camera = this.itownsView.camera.camera3D;
    let position = camera.position;
    console.log(camera);
  }

  getGeovolumeInCollectionById(id) {
    for (let geoVolume of this.collection) {
      if (geoVolume.containGeovolumeById(id))
        return geoVolume.getGeovolumeById(id);
    }
    return false;
  }

  loadCollection() {
    return new Promise((resolve, reject) => {
      jquery.ajax({
        type: 'GET',
        url: this.url,
        success: (data) => {
          for (let el of data) {
            this.collection.push(new GeoVolume(el));
          }
          console.log(this.collection);
          resolve();
        },
        error: (e) => {
          console.error(e);
          reject();
        },
      });
    });
  }

  loadData(geoVolume, extent = null) {
    let dataUrl = this.buildDataUrl(geoVolume, extent);
    // jquery.ajax({
    //   type: 'GET',
    //   url: this.url,
    //   async: false,
    //   success: (data) => {
    //     for(let el of data){
    //       this.collections.push(new GeoVolume(el));
    //     }
    //   }
    // });
  }

  buildDataUrl(geoVolume, extent = null) {
    let buildUrl = geoVolume;
    buildUrl += extent ? this.urlFromExtent(extent) : '';
    console.log(buildUrl);
  }

  urlFromExtent(extent) {
    if (extent) {
      let url =
        '?bbox=' +
        extent.west +
        ',' +
        extent.east +
        ',' +
        extent.south +
        ',' +
        extent.north;
      if (extent.crs) url += '&crs=' + extent.crs;
      return url;
    }
    throw new Error(
      'extent is not defined in urlFromExtent() from GeoVolumeSouce'
    );
  }
}
