import { Widgets } from "ud-viz";
import { SensorWindow } from "./SensorWindow";

export class SensorExtension extends Widgets.Components.ModuleView {
  constructor(geoVolumeModule, htmlList) {
    super();
    this.geoVolumeModule = geoVolumeModule;
    this.htmlList = htmlList;
    this.createExtension();
  }

  createExtension() {
    var button = document.createElement("button");
    button.innerText = "Show sensor Data";
    button.onclick = () => {
        this.sensorWindow = new SensorWindow(this.geoVolumeModule.parentElement);
    };
    this.htmlList.appendChild(button);
  }
}
