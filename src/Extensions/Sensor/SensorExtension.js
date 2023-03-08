import { Widget } from '@ud-viz/browser';
import { GeoVolumeWindow } from '../GeoVolume/GeoVolume/View/GeoVolumeWindow';
import { SensorWindow } from './SensorWindow';

export class SensorExtension extends Widget.Component.WidgetView {
  constructor(geoVolumeModule) {
    super();
    this.geoVolumeModule = geoVolumeModule;
    this.createExtension();
  }

  createExtension() {
    this.geoVolumeModule.view.addEventListener(
      GeoVolumeWindow.GEOVOLUME_COLLECTION_UPDATED,
      () => {
        let div_sensor = document.getElementById('geoVolume_sensor');
        if (div_sensor) {
          let new_button = document.createElement('button');
          new_button.innerText = 'Sensor Data';
          new_button.onclick = () => {
            new SensorWindow(this.geoVolumeModule.view.parentElement);
          };
          div_sensor.append(new_button);
        }
      }
    );
  }
}
