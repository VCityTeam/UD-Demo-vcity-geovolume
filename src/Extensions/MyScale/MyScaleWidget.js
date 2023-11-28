import * as itowns from "itowns";
import { findChildByID } from "../GeoVolume/Utils/htmlUtils"; 
import { GeoVolumeWindow } from "../GeoVolume/GeoVolume/View/GeoVolumeWindow";
export class MyScaleWidget  {
  constructor(geoVolumeWindow, itownsView) {
    /** @type {HTMLElement} */
    this.rootHtml = document.createElement("div");
    this.rootHtml.innerHTML = this.innerContentHtml;
    this.rootHtml.id = "my_scale";

    this.itownsView = itownsView;

    this.itownsView.domElement.appendChild(this.rootHtml);

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
    <div> LoS 
<input type="range" id="${this.getScaleRangeId}" class="myrange" name="temp" list="markers" step="1" min="0" max="26" disabled/>
<datalist id="markers">
<option class="ticks" value="26">26 Object</option>
<option class="ticks" value="25">25 Door, window</option>
<option class="ticks" value="24">24 Table</option>
<option class="ticks" value="23">23</option>
<option class="ticks" value="22">22 Room</option>
<option class="ticks" value="21">21 Floor</option>
<option class="ticks" value="20">20 Mid-sized building</option>
<option class="ticks" value="19">19 </option>
<option class="ticks" value="18">18 Site, park</option>
<option class="ticks" value="17">17 Block, park</option>
<option class="ticks" value="16">16 Street</option>
<option class="ticks" value="15">15 Small road</option>
<option class="ticks" value="14">14</option>
<option class="ticks" value="13">13 Village, suburb</option>
<option class="ticks" value="12">12 Town, City distric</option>
<option class="ticks" value="11">11 City</option>
<option class="ticks" value="10">10 Metropolitan area</option>
<option class="ticks" value="9">9 Wide area</option>
<option class="ticks" value="8">8</option>
<option class="ticks" value="7">7 Small Country, US State</option>
<option class="ticks" value="6">6 European Country</option>
<option class="ticks" value="5">5 African Country</option>
<option class="ticks" value="4">4</option>
<option class="ticks" value="3">3 </option>
<option class="ticks" value="2">2 Continent</option>
<option class="ticks" value="1">1</option>
<option class="ticks" value="0">0 World</option>
</datalist>
</div>
    `;
  }

  update() {
    let width = Math.round(
      this.itownsView.getPixelsToMeters(this.itownsView.camera.width)
    );
    this.getScaleRangeElement.value = Math.round(Math.log2(40075008 / width)) + 1;
  }

  get getScaleRangeId() {
    return `scale_range`;
  }

  get getScaleRangeElement() {
    return findChildByID(this.rootHtml, this.getScaleRangeId);
  }
}
