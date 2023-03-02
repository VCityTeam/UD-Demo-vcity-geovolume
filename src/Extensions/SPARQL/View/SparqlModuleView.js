import { Widget } from '@ud-viz/browser';
import { SparqlQueryWindow } from './SparqlQueryWindow';
import { CityObjectProviderPatch } from '../CityObjectProviderPatch';
import { GeoVolumeWindow } from '../../GeoVolume/GeoVolume/View/GeoVolumeWindow';
/**
 * The SPARQL ModuleView class which manages the SPARQL query window.
 */
export class SparqlModuleView extends Widget.Component.WidgetView {
  /**
   * Creates a new SparqlModuleView.
   *
   * @param {SparqlEndpointResponseProvider} sparqlProvider The SPARQL Endpoint Response Provider
   * @param {CityObjectProviderPatch} cityObjectProvider The City Object Provider
   * @param {LayerManager} layerManager The UD-Viz LayerManager.
   */
  constructor(sparqlProvider, cityObjectProvider, layerManager, geoVolumeModule) {
    super();

    /**
     * The SPARQL Endpoint Response Provider
     *
     * @type {SparqlEndpointResponseProvider}
     */
    this.sparqlProvider = sparqlProvider;

    /**
     * The Extended City Object Provider
     *
     * @type {CityObjectProviderPatch}
     */
    this.cityObjectProvider = cityObjectProvider;

    /**
     * The UD-Viz LayerManager.
     *
     * @type {LayerManager}
     */
    this.layerManager = layerManager;

    /**
     * Contains a SparqlQueryWindow for capturing user input and displaying
     * query results.
     *
     * @type {SparqlQueryWindow}
     */
    this.window;
    
    this.geoVolumeModule = geoVolumeModule;

    this.createExtension();
  }

  createExtension() {
    this.geoVolumeModule.view.addEventListener(
      GeoVolumeWindow.GEOVOLUME_COLLECTION_UPDATED,
      () => {
        let RDF_divs = document.getElementsByClassName(`geoVolume_sparql`);
        for (let div_RDF of RDF_divs)
        {
          let geovolume = this.geoVolumeModule.geoVolumeSource.getgeoVolumeInCollectionById(div_RDF.getAttribute("geoVolumeId"));
          let content = geovolume.getContentByTitle(div_RDF.getAttribute("variantId"));
          if (div_RDF) {
            let new_button = document.createElement("button");
            new_button.innerText = "SparQL query";
            new_button.onclick = () => {
              this.window = new SparqlQueryWindow(this.sparqlProvider, this.cityObjectProvider, this.layerManager,this.geoVolumeModule.view.parentElement,content);
            };
            div_RDF.append(new_button);
          }
        }
      }
    );
  }
}
