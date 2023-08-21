import { EventSender } from "@ud-viz/shared/src";
import { itowns } from "@ud-viz/browser/src";
import { GeoVolumeWindow } from "../GeoVolume/GeoVolume/View/GeoVolumeWindow";
import { findChildByID } from "@ud-viz/browser/src";
export class MyScaleWidget extends EventSender {
  constructor(geoVolumeWindow, frame3DPlanar) {
    super();
    /** @type {HTMLElement} */
    this.rootHtml = document.createElement("div");
    this.rootHtml.innerHTML = this.innerContentHtml;
    this.rootHtml.id = "my_scale";

    this.itownsView = frame3DPlanar.itownsView;
    this.frame3DPlanar = frame3DPlanar;

    frame3DPlanar.rootHtml.appendChild(this.rootHtml);

    this.itownsView.addEventListener(itowns.VIEW_EVENTS.LAYERS_INITIALIZED, () => {
      this.update();
    });
    this.itownsView.addEventListener(itowns.PLANAR_CONTROL_EVENT.MOVED, () => {
      this.update();
    });

    geoVolumeWindow.addEventListener(
      GeoVolumeWindow.GEOVOLUME_COLLECTION_UPDATED,
      () => {
        this.update();
      }
    );
  }

  get innerContentHtml() {
    return /*html*/ `
    LoS
<input type="range" id="${this.getScaleRangeId}" class="myrange" name="temp" list="markers" step="1" min="0" max="26" disabled/>
<datalist id="markers">
<option class="ticks" value="26">26</option>
<option class="ticks" value="25">25</option>
<option class="ticks" value="24">24</option>
<option class="ticks" value="23">23</option>
<option class="ticks" value="22">22</option>
<option class="ticks" value="21">21</option>
<option class="ticks" value="20">20</option>
<option class="ticks" value="19">19</option>
<option class="ticks" value="18">18</option>
<option class="ticks" value="17">17</option>
<option class="ticks" value="16">16</option>
<option class="ticks" value="15">15</option>
<option class="ticks" value="14">14</option>
<option class="ticks" value="13">13</option>
<option class="ticks" value="12">12</option>
<option class="ticks" value="11">11</option>
<option class="ticks" value="10">10</option>
<option class="ticks" value="9">9</option>
<option class="ticks" value="8">8</option>
<option class="ticks" value="7">7</option>
<option class="ticks" value="6">6</option>
<option class="ticks" value="5">5</option>
<option class="ticks" value="4">4</option>
<option class="ticks" value="3">3</option>
<option class="ticks" value="2">2</option>
<option class="ticks" value="1">1</option>
<option class="ticks" value="0">0</option>
</datalist>
    `;
  }

  update() {
    let width = Math.round(
      this.itownsView.getPixelsToMeters(this.itownsView.camera.width)
    );
    
    this.getScaleRangeElement.value = Math.round(Math.log2(40075008 / width));
  }

  get getScaleRangeId() {
    return `scale_range`;
  }

  get getScaleRangeElement() {
    return findChildByID(this.rootHtml, this.getScaleRangeId);
  }
}
