import { EventSender } from "@ud-viz/shared/src";
import { itowns } from "@ud-viz/browser/src";
import { findChildByID } from "@ud-viz/browser/src";
export class ScaleWidget extends EventSender {
  constructor(frame3DPlanar) {
    super();
    /** @type {HTMLElement} */
    this.rootHtml = document.createElement("div");
    this.rootHtml.innerHTML = this.innerContentHtml;
    this.rootHtml.id = "scale";

    this.rootHtml.style.width = `${200}px`;

    this.itownsView = frame3DPlanar.itownsView;
    this.frame3DPlanar = frame3DPlanar;

    frame3DPlanar.rootHtml.appendChild(this.rootHtml);

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
