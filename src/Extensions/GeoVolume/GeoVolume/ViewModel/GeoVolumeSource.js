import {THREE,itowns,jquery}  from 'ud-viz';
import { GeoVolume } from '../Model/GeoVolume';

/**
 * const GeoVolumeSource = new GeoVolumeSource({
 *     url: 'http://dummy.fr/',
 *     crs: 'crs:4326',
 *     extent: {
 *         west: 4.568,
 *         east: 5.18,
 *         south: 45.437,
 *         north: 46.03,
 *     },
 *     format: 'application/json'
 * });
 */

export class GeoVolumeSource extends itowns.Source {
  /**
   * @param {Object} source - An object that can contain the url of a GeoVolume API.
   * @param {Object} itownsView
   *
   * @constructor
   */
  constructor(source,itownsView) {
    super(source);

    this.isGeoVolumeSource = true;
    this.itownsView = itownsView;
    this.url = `${source.url}`;
    /**
     * Array of GeoVolume
     */
    this.collection = new Array();
  }

  get Collections(){
    return this.collection;
  }

  getgeoVolumeWith3DTilesFromCollection(){
    let geoVolumes = new Array();
    for (let geoVolume of this.collection){
      geoVolumes.push(geoVolume.getGeoVolumesWith3DTiles());
    }
    return geoVolumes;
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

  getgeoVolumesFromExtent(){
    let extent = this.getVisibleExtent();
    let crs = this.itownsView.referenceCrs;
    return this.getgeoVolumes(extent,crs);
  }

  getgeoVolumeInCollectionById(id) {
    for (let geoVolume of this.collection) {
      if (geoVolume.containGeovolumeById(id))
        return geoVolume.getGeovolumeById(id);
    }
    return false;
  }

  createCollectionFromGeoVolume(geoVolume){
    for(let children of geoVolume.children){
      this.createCollectionFromGeoVolume(children);
    }
    geoVolume.children = new Array();
    this.collection.push(geoVolume);
  }

  getgeoVolumes(extent = null,crs = null) {
    let url = this.buildUrl(extent,crs);
    return new Promise((resolve, reject) => {
      jquery.ajax({
        type: 'GET',
        url: url,
        success: (data) => {
          this.collection = new Array();
          for (let el of data) {
            // this.collection.push(new GeoVolume(el));
            this.createCollectionFromGeoVolume(new GeoVolume(el));
          }
          resolve();
        },
        error: (e) => {
          console.error(e);
          reject();
        },
      });
    });
  }

  buildUrl(extent = null,crs = null) {
    return extent ? this.url + '?bbox=' + this.extentToUrl(extent) + '&crs=' + crs : this.url;
  }

  extentToUrl(extent) {
    return extent[0].x.toString() + ',' +
            extent[0].y.toString() + ',' +
            extent[0].z.toString() + ',' +
            extent[1].x.toString() + ',' +
            extent[1].y.toString() + ',' +
            extent[1].z.toString();
  }
}
