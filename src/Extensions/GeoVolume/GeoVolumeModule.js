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
  constructor(geoVolumeConfig,view) {

    this.view = view;
    this.geoVolumeSource = new GeoVolumeSource({
      name: 'geoVolumeSource',
      url: geoVolumeConfig.url,
    },
    view);

    this.window = new GeoVolumeWindow(this.geoVolumeSource,view);
  }
}
