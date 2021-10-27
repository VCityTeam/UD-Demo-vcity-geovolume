import { Source } from 'itowns';
import {THREE}  from 'ud-viz';
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
    this.url = `${source.url}`;
    console.log(itownsView);
    setTimeout(() => {  this.getGeovolumesFromExtent(); }, 2000);


    /**
     * Array of geovolumes
     */
    this.collection = new Array();

    // this.getGeoVolumes();
  }

  getVisibleExtent(){
    let camera = this.itownsView.camera.camera3D;
    var raycaster = new THREE.Raycaster();
    var plane = new THREE.Plane( new THREE.Vector3( 0, 0, 1 ), 0 );

    //Compute ray from the bottom left corner of the camera to the ground
    raycaster.setFromCamera( new THREE.Vector2(-1,-1), camera );
    var min = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, min);

    //Compute ray from the top right corner of the camera to the ground
    raycaster.setFromCamera( new THREE.Vector2(1,1), camera );
    var max = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, max);
    max.setZ(camera.position.z);

    return [min,max]; 
  }

  getGeovolumesFromExtent(){
    let extent = this.getVisibleExtent();
    let EPSG = this.itownsView.referenceCrs;
    this.getGeoVolumes(extent,EPSG);

  }

  getGeovolumeInCollectionById(id) {
    for (let geoVolume of this.collection) {
      if (geoVolume.containGeovolumeById(id))
        return geoVolume.getGeovolumeById(id);
    }
    return false;
  }

  getGeoVolumes(extent = null,EPSG = null) {
    let url = this.buildUrl(extent,EPSG);
    return new Promise((resolve, reject) => {
      jquery.ajax({
        type: 'GET',
        url: url,
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

  buildUrl(extent = null,EPSG = null) {
    return extent ? this.url + "?bbox=" + this.extentToUrl(extent) + "&EPSG=" + EPSG : this.url;
  }

  extentToUrl(extent) {
    return extent[0].x.toString() + "," +
            extent[0].y.toString() + "," +
            extent[0].z.toString() + "," +
            extent[1].x.toString() + "," +
            extent[1].y.toString() + "," +
            extent[1].z.toString();
  }
}
