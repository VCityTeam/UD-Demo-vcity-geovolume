import { Widgets } from 'ud-viz/src';
import { GeoVolumeWindow } from './GeoVolume/View/GeoVolumeWindow';
import { GeoVolumeSource } from './GeoVolume/ViewModel/GeoVolumeSource';

/**
 * The GeoVolume module class used to initialize the GeoVolume widget
 */
export class GeoVolumeModule extends Widgets.Components.ModuleView {
  /**
   * Creates a new GeoVolume Module.
   *
   */
  constructor(geoVolumeConfig,allWidgetTemplate) {
    super();
    this.app = allWidgetTemplate;
    this.geoVolumeSource = new GeoVolumeSource({
      extent: allWidgetTemplate.extent,
      crs: allWidgetTemplate.extent.crs,
      name: 'geoVolumeSource',
      url: geoVolumeConfig.url,
    },
    allWidgetTemplate.view3D.itownsView);

    this.view = new GeoVolumeWindow(this.geoVolumeSource,allWidgetTemplate);
  }
}
