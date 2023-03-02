import { SparqlEndpointResponseProvider } from './ViewModel/SparqlEndpointResponseProvider';
import { SparqlModuleView } from './View/SparqlModuleView';
import { CityObjectProviderPatch } from './CityObjectProviderPatch';

/**
 * The SPARQL module class used to initialize the SPARQL widget
 */
export class SparqlModule {
  /**
   * Creates a new SPARQL Module.
   *
   * @param {object} config The configuration of UD-Viz.
   * @param {object} config.sparqlModule The sparqlModule configuration.
   * @param {string} config.sparqlModule.url The SPARQL endpoint url.
   * @param {LayerManager} layerManager The UD-Viz LayerManager.
   */
  constructor(config, layerManager, geoVolumeModule) {
    this.config = config;

    /**
     * Manages data layers visualized in the application.
     *
     * @type {LayerManager}
     */    
    this.layerManager = layerManager;

    /**
     * Manages events and HTTP responses from SPARQL Endpoint.
     *
     * @type {SparqlEndpointResponseProvider}
     */
    this.sparqlProvider = new SparqlEndpointResponseProvider(this.config);

    /**
     * Provides CityObjects based on mouse event positions or batch table data.
     *
     * @type {CityObjectProviderPatch}
     */
    this.cityObjectProvider = new CityObjectProviderPatch(this.layerManager);

    this.geoVolumeModule = geoVolumeModule;
    /**
     * Contains a SparqlModuleView for managing the user interface and view.
     *
     * @type {SparqlModuleView}
     */
    this.view = new SparqlModuleView(
      this.sparqlProvider,
      this.cityObjectProvider,
      this.layerManager,
      this.geoVolumeModule
    );
  }
}
