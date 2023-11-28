import * as itowns from "itowns";

import { findChildByID } from "../GeoVolume/Utils/htmlUtils"; 

export class ScaleWidget {
  constructor(itownsView) {
    /** @type {HTMLElement} */
    this.rootHtml = document.createElement("div");
    this.rootHtml.innerHTML = this.innerContentHtml;
    this.rootHtml.id = "scale";

    this.rootHtml.style.width = `${260}px`;

    this.itownsView = itownsView;

    this.itownsView.domElement.appendChild(this.rootHtml);

    this.itownsView.addEventListener(itowns.VIEW_EVENTS.INITIALIZED, () => {
      this.update();
    });
    this.itownsView.addEventListener(itowns.PLANAR_CONTROL_EVENT.MOVED, () => {
      this.update();
    });
  }

  get innerContentHtml() {
    return /*html*/ `
    <div id= "${this.getScaleTextId}">
        </div>
    `;
  }

  update() {

    let metricDistance = Math.round(this.itownsView.getPixelsToMeters(200));

    const digit = 10 ** (metricDistance.toString().length - 1);
    metricDistance = Math.round(metricDistance / digit) * digit;

    const pixelDistance = this.itownsView.getMetersToPixels(metricDistance);
    // this.rootHtml.style.height = `${pixelDistance}px`;

    let unit = 'm';
    if (metricDistance >= 1000) {
        metricDistance /= 1000;
        unit = 'km';
    }

    this.getScaleTextElement.innerHTML = `${metricDistance} ${unit}`;
  }

  get getScaleTextId() {
    return `scale_text`;
  }

  get getScaleTextElement() {
    return findChildByID(this.rootHtml, this.getScaleTextId);
  }
}
