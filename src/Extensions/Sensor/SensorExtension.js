import { GeoVolumeWindow } from '../GeoVolume/GeoVolume/View/GeoVolumeWindow';
import { SensorWindow } from './SensorWindow';

export class SensorExtension {
  constructor(geoVolumeModule, config) {
    this.geoVolumeModule = geoVolumeModule;
    this.createExtension(config);
  }

  createExtension(config) {
    this.geoVolumeModule.view.addEventListener(
      GeoVolumeWindow.GEOVOLUME_COLLECTION_UPDATED,
      () => {
        let div_sensor = document.getElementById('geoVolume_sensor');
        if (div_sensor) {
          let new_button = document.createElement('button');
          new_button.innerText = 'Sensor Data';
          new_button.onclick = () => {
            new SensorWindow(this.geoVolumeModule.view.parentElement,config);
          };
          div_sensor.append(new_button);
        }
      }
    );
  }
}
