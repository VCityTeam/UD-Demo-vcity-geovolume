import { GeoVolumeWindow } from './GeoVolume/View/GeoVolumeWindow';
import { GeoVolumeSource } from './GeoVolume/ViewModel/GeoVolumeSource';

/**
 * The GeoVolume module class used to initialize the GeoVolume widget
 */
export class GeoVolumeModule {
  /**
   * Creates a new GeoVolume Module.
   *
   */
  constructor(geoVolumeConfig,frame3DPlanar) {
    this.frame3DPlanar = frame3DPlanar;

    this.geoVolumeSource = new GeoVolumeSource({
      name: 'geoVolumeSource',
      url: geoVolumeConfig.url,
    },
    this.frame3DPlanar.itownsView);

    this.view = new GeoVolumeWindow(this.geoVolumeSource,this.frame3DPlanar);
  }
}
