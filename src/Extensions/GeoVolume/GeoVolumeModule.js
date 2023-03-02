import { Widget } from '@ud-viz/browser';
import { GeoVolumeWindow } from './GeoVolume/View/GeoVolumeWindow';
import { GeoVolumeSource } from './GeoVolume/ViewModel/GeoVolumeSource';

/**
 * The GeoVolume module class used to initialize the GeoVolume widget
 */
export class GeoVolumeModule extends Widget.Component.WidgetView {
  /**
   * Creates a new GeoVolume Module.
   *
   */
  constructor(geoVolumeConfig,allWidgetTemplate) {
    super();
    this.app = allWidgetTemplate;

    this.geoVolumeSource = new GeoVolumeSource({
      name: 'geoVolumeSource',
      url: geoVolumeConfig.url,
    },
    allWidgetTemplate.frame3DPlanar.itownsView);

    this.view = new GeoVolumeWindow(this.geoVolumeSource,allWidgetTemplate);
  }
}
