import { loadTextFile, focusCameraOn, tokenizeURI } from '@ud-viz/utils_browser';
import { findChildByID } from "../GeoVolume/Utils/htmlUtils";
import { JsonRenderer,Table,Graph,SparqlEndpointResponseProvider } from "@ud-viz/widget_sparql";
import * as itowns from "itowns";
import * as THREE from "three";
import "./SparqlQueryWindow.css";
import { GeoVolumeWindow } from "../GeoVolume/GeoVolume/View/GeoVolumeWindow";

/**
 * The SPARQL query window class which provides the user interface for querying
 * a SPARQL endpoint and displaying the endpoint response.
 */
export class SparqlQueryWindow {
  /**
   * Creates a SPARQL query window.
   *
   * @param {SparqlEndpointResponseProvider} sparqlProvider The SPARQL Endpoint Response Provider
   * @param {itowns.PlanarView} itownsView view
   * @param {object} configSparqlWidget The sparqlModule view configuration.
   * @param {object} configSparqlWidget.queries Query configurations
   * @param {object} configSparqlWidget.queries.title The query title
   * @param {object} configSparqlWidget.queries.filepath The path to the file which contains the query text
   * @param {object} configSparqlWidget.queries.formats Configuration for which visualizations are allowed
   *                                              with this query. Should be an object of key, value
   *                                              pairs. The keys of these pairs should correspond
   *                                              with the cases in the updateDataView() function.
   */
  constructor(
    sparqlProvider,
    frame3DPlanar,
    configSparqlWidget,
    geoVolumeWidget
  ) {

    /** @type {HTMLElement} */
    this.domElement = document.createElement("div");
    this.domElement.setAttribute("id", "_window_sparqlQueryWindow");
    this.domElement.innerHTML = this.innerContentHtml;

    /**
     * The SPARQL Endpoint Response Provider
     *
     * @type {SparqlEndpointResponseProvider}
     */
    this.sparqlProvider = sparqlProvider;

    /** @type {itowns.PlanarView} */
    this.itownsView = frame3DPlanar.itownsView;

    this.frame3DPlanar = frame3DPlanar;

    /**
     *A reference to the JsonRenderer class
     *
     * @type {JsonRenderer}
     */
    this.jsonRenderer = new JsonRenderer();

    /**
     * Contains the D3 graph view to display RDF data.
     *
     * @type {Graph}
     */
    this.graph = new Graph(this, configSparqlWidget);

    /**
     * Contains the D3 table to display RDF data.
     *
     * @type {Table}
     */
    this.table = new Table(this);

    /**
     * Store the queries of the SparqlQueryWindow from the config.
     *
     * @type {object}
     */
    this.queries = configSparqlWidget["queries"];

    this.registerEvent(Graph.EVENT_NODE_CLICKED);
    this.registerEvent(Graph.EVENT_NODE_MOUSEOVER);
    this.registerEvent(Graph.EVENT_NODE_MOUSEOUT);
    this.registerEvent(Table.EVENT_CELL_CLICKED);

    /**
     * Sets the SparqlEndpointResponseProvider
     * and graph view. Also updates this.queries with the queries declared in the configuration file
     * Should be called by a `SparqlWidgetView`. Once this is done,
     * the window is actually usable ; service event listerers are set here.
     */

    // Get queries from text files and update the this.queries
    const promises = [];
    this.queries.forEach((query) => {
      promises.push(
        loadTextFile(query.filepath).then((result) => {
          query.text = result;
        })
      );
    });

    //index of the viewed query
    let index = -1;


    this.sparqlProvider.addEventListener(
      SparqlEndpointResponseProvider.EVENT_ENDPOINT_RESPONSE_UPDATED,
      (response) => {
        this.response = response;
        this.updateDataView(
          findChildByID(this.domElement, this.resultSelectId).value
        );
      }
    );

    this.resultSelect.onchange = () => {
      if (this.response)
        this.updateDataView(
          findChildByID(this.domElement, this.resultSelectId).value
        );
    };

    const fetchC3DTileFeatureWithNodeText = (node_text) => {
      let result = null;
      this.itownsView
        .getLayers()
        .filter((el) => el.isC3DTilesLayer)
        .forEach((c3DTilesLayer) => {
          for (const [
            // eslint-disable-next-line no-unused-vars
            tileId,
            tileC3DTileFeatures,
          ] of c3DTilesLayer.tilesC3DTileFeatures) {
            // eslint-disable-next-line no-unused-vars
            for (const [batchId, c3DTileFeature] of tileC3DTileFeatures) {
              if (
                c3DTileFeature.getInfo().batchTable["gml_id"] ==
                tokenizeURI(node_text).id
              ) {
                result = {
                  feature: c3DTileFeature,
                  layer: c3DTilesLayer,
                };
                break;
              }
            }
          }
        });

      return result;
    };

    this.addEventListener(Graph.EVENT_NODE_CLICKED, (node_text) => {
      const clickedResult = fetchC3DTileFeatureWithNodeText(node_text);

      if (!clickedResult) return;

      focusCameraOn(
        this.itownsView,
        this.itownsView.controls,
        clickedResult.layer
          .computeWorldBox3(clickedResult.feature)
          .getCenter(new THREE.Vector3()),
        {
          verticalDistance: 200,
          horizontalDistance: 200,
        }
      );
    });

    this.addEventListener(Table.EVENT_CELL_CLICKED, (cell_text) => {
      const clickedResult = fetchC3DTileFeatureWithNodeText(cell_text);

      if (!clickedResult) return;

      focusCameraOn(
        this.itownsView,
        this.itownsView.controls,
        clickedResult.layer
          .computeWorldBox3(clickedResult.feature)
          .getCenter(new THREE.Vector3()),
        {
          verticalDistance: 200,
          horizontalDistance: 200,
        }
      );
    });

    const parent = document.createElement('div');
    parent.style.width = 'fit-content';
    parent.style.position = 'absolute';
    parent.style.right = '0px';
    parent.style.display = 'none';
    parent.style.zIndex = 2;
    parent.appendChild(this.domElement);
  
    frame3DPlanar.rootHtml.appendChild(parent);

    this.closeButton.onclick = () => {
      parent.style.display = 'none';
    };

    geoVolumeWidget.addEventListener(
      GeoVolumeWindow.GEOVOLUME_SHOWN,
      (geoVolume) => {
        if (geoVolume.content.length > 0) {
          for (let c of geoVolume.content) {
            if (c.type.includes("sparql")) {
              var li = document.getElementById(c.id);
              var graphButton = document.createElement("button");
              graphButton.className =
                "w3-btn w3-medium w3-bar-item w3-round w3-border w3-right";
              let logo = document.createElement("img");
              logo.src = "../assets/icons/graph.svg";
              logo.width = "20";
              graphButton.appendChild(logo);
              graphButton.onclick = () => {
                Promise.all(promises).then(() => {
                  let index_temp = -1;
                  if(c.variantIdentifier.includes("vt")) index_temp = 0;
                  if(c.variantIdentifier.includes("GMLID")) index_temp = 1;
                  if(c.variantIdentifier.includes("GUID")) index_temp = 2;
                  if(index_temp != this.index){
                    this.index = index_temp;
                    this.updateResultDropdown(this.index);
                    this.sparqlProvider.querySparqlEndpointService(
                      this.queries[this.index].text
                    );
                  }
                  parent.style.display = "block";
                });
              };
              li.appendChild(graphButton);
            }
          }
        }
      }
    );


  }


  /**
   * Update the DataView.
   *
   * @param {object} response A JSON object returned by a SparqlEndpointResponseProvider.EVENT_ENDPOINT_RESPONSE_UPDATED event
   * @param {string} view_type The selected semantic data view type.
   */
  updateDataView(view_type) {
    this.clearDataView();
    switch (view_type) {
      case "graph":
        this.graph.update(this.response);
        this.dataView.append(this.graph.canvas);
        break;
      case "json":
        this.jsonRenderer.renderjson.set_icons("▶", "▼");
        this.jsonRenderer.renderjson.set_max_string_length(40);
        this.dataView.append(this.jsonRenderer.renderjson(this.response));
        break;
      case "table":
        this.table.dataAsTable(
          this.response.results.bindings,
          this.response.head.vars
        );
        this.table.filterInput.addEventListener("change", (e) =>
          Table.update(this.table, e)
        );
        this.dataView.style["height"] = "500px";
        this.dataView.style["overflow"] = "scroll";
        break;
      default:
        console.error("This result format is not supported: " + view_type);
    }
  }

  /**
   * Clear the DataView of content.
   */
  clearDataView() {
    this.dataView.innerHTML = "";
    this.dataView.style["height"] = "100%";
    this.dataView.style["overflow"] = "auto";
  }

  /**
   * Remove all the children of this.resultSelect, then adds new children options based
   * on the formats declared in each query configuration from from this.queries
   *
   * @param {number} index - the index of the query in the queries array
   */
  updateResultDropdown(index) {
    // this is a weird work around to do this.resultSelect.children.forEach(...)
    while (this.resultSelect.children.length > 0) {
      this.resultSelect.removeChild(this.resultSelect.children.item(0));
    }

    const formats = Object.entries(this.queries[Number(index)].formats);
    formats.forEach(([k, v]) => {
      const option = document.createElement("option");
      option.value = k;
      option.innerHTML = v;
      this.resultSelect.appendChild(option);
    });
  }

  // SPARQL Window getters //
  get innerContentHtml() {
    return /* html*/ `
      <div class="box-section">
          <label>Results Format: </label>
          <select id="${this.resultSelectId}"></select>
          <button id="${this.closeButtonId}" class="w3-btn w3-medium w3-round w3-border">Close</button>
      </div>
      <div id="${this.dataViewId}" class="box-selection"/>`;
  }

  get dataViewId() {
    return `sparql_window_data_view`;
  }

  get closeButtonId() {
    return `sparql_window_close_button`;
  }

  get closeButton() {
    return findChildByID(this.domElement, this.closeButtonId);
  }

  get dataView() {
    return findChildByID(this.domElement, this.dataViewId);
  }

  get resultSelectId() {
    return `sparql_window_result_select`;
  }

  get resultSelect() {
    return findChildByID(this.domElement, this.resultSelectId);
  }
}
