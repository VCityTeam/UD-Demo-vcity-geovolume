import { Widget } from "@ud-viz/browser";
import * as jquery from 'jquery';
export class SensorWindow extends Widget.Component.GUI.Window {
  constructor(htmlElement) {
    super("sensorWindow", "Sensor", false);

    this.user = "admin";
    this.password = "CARLSource69";
    this.sensorData = new Object();
    this.training_url = "http://training-iot.bl-predict.research-bl.com:8086";
    this.request_max = `SELECT max("value") FROM "BAT_CARL"."autogen"."BAT_CARL" WHERE time > now()-24h AND "capteurs"='CARL_TAMB_HALL_MOY'`;
    this.request_min = `SELECT min("value") FROM "BAT_CARL"."autogen"."BAT_CARL" WHERE time > now()-24h AND "capteurs"='CARL_TAMB_HALL_MOY'`;
    this.request_mean = `SELECT last("value") AS "mean_value" FROM "BAT_CARL"."autogen"."BAT_CARL" WHERE "capteurs"='CARL_TAMB_HALL_MOY'`;
    this.appendTo(htmlElement);
  }

  windowCreated() {
    this.getData(this.request_max, "max").then(() => {
      this.maxTimeElement.innerText = "Date : " + this.sensorData["max"].time;
      this.maxValueElement.innerText =
        "Min temp : " + this.sensorData["max"].value;
    });
    this.getData(this.request_mean, "mean").then(() => {
      this.meanTimeElement.innerText =
        "Last measure : " + this.sensorData["mean"].time;
      this.meanValueElement.innerText =
        "Mean temp : " + this.sensorData["mean"].value;
    });
    this.getData(this.request_min, "min").then(() => {
      this.minTimeElement.innerText = "Date : " + this.sensorData["min"].time;
      this.minValueElement.innerText =
        "Min temp : " + this.sensorData["min"].value;
    });
  }

  get innerContentHtml() {
    return /*html*/ `
    <div class="box-section" id=${this.sensorDivID}>
        <div class ="box-section" id="meanValue">
            <div id="${this.meanValueId}">mean : 19.5</div>
            <div id="${this.meanTimeId}">Last 24h</div>
        </div>
        <div class ="box-section" id="maxValue">
            <div class id="${this.maxValueId}">max : 20.5</div>
            <div class id="${this.maxTimeId}">08/12/2022 14h12</div>
        </div>
        <div class ="box-section" id="minValue">
            <div class id="${this.minValueId}">min : 18.5</div>
            <div class id="${this.minTimeId}">08/12/2022 3h05</div>
        </div>
    </div>
    `;
  }

  buildUrl(influx_url, base, query, format_time) {
    return (
      influx_url +
      "/query?db=" +
      base +
      "&u=" +
      this.user + 
      "&p=" +
      this.password +
      "&epoch=" +
      format_time +
      "&q=" +
      query
    );
  }

  getData(request, value) {
    let url = this.buildUrl(this.training_url, "BAT_CARL", request, "s");
    return new Promise((resolve, reject) => {
      jquery.ajax({
        type: "GET",
        url: url,
        headers: { Accept: "application/xhtml+xml" },
        success: (data) => {
          const results = data.results[0].series[0].values[0];
          var dt = new Date(results[0] * 1000).toLocaleString();
          this.sensorData[value] = {
            time: dt,
            value: +results[1].toFixed(2),
          };
          resolve();
        },
        error: (e) => {
          console.error(e);
          reject();
        },
      });
    });
  }

  get sensorDivID() {
    return "sensor_data";
  }

  get sensorDivElement() {
    return document.getElementById(this.sensorDivID);
  }

  get meanValueId() {
    return `${this.windowId}_mean_value`;
  }

  get meanValueElement() {
    return document.getElementById(this.meanValueId);
  }

  get meanTimeId() {
    return `${this.windowId}_mean_time`;
  }

  get meanTimeElement() {
    return document.getElementById(this.meanTimeId);
  }

  get maxValueId() {
    return `${this.windowId}_max_value`;
  }

  get maxValueElement() {
    return document.getElementById(this.maxValueId);
  }

  get maxTimeId() {
    return `${this.windowId}_max_time`;
  }

  get maxTimeElement() {
    return document.getElementById(this.maxTimeId);
  }

  get minValueId() {
    return `${this.windowId}_min_value`;
  }

  get minValueElement() {
    return document.getElementById(this.minValueId);
  }

  get minTimeId() {
    return `${this.windowId}_min_time`;
  }

  get minTimeElement() {
    return document.getElementById(this.minTimeId);
  }
}
