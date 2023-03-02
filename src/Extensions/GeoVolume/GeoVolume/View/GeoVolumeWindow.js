import { Widget, itowns, THREE, setup3DTilesLayer} from "@ud-viz/browser";
import { TilesManager } from '@ud-viz/browser/src/Component/Itowns/Itowns';
import { CityObjectID } from '@ud-viz/browser/src/Component/Itowns/Itowns';

import { refinementFiltered } from "../../Utils/Refinement";
// import { SensorExtension } from '../../../Sensor/SensorExtension';
export class GeoVolumeWindow extends Widget.Component.GUI.Window {
  constructor(geoVolumeSource, allWidget) {
    super("geovolumeWindow", "GeoVolume", false);
    this.geoVolumeSource = geoVolumeSource;
    this.itownsView = allWidget.getFrame3DPlanar().getItownsView();
    this.app = allWidget;
    this.bboxGeomOfGeovolumes = new Array();

    let clickListener = (event) => {
      this.onMouseClick(event);
    };
    this.app.viewerDivElement.addEventListener("mousedown", clickListener);

    this.registerEvent(GeoVolumeWindow.GEOVOLUME_COLLECTION_UPDATED);
  }

  onMouseClick(event) {
    // event.preventDefault();
    // let raycaster = new THREE.Raycaster();
    // let mouse3D = new THREE.Vector2(
    //   (event.layerX / this.app.view3D.rootWebGL.offsetWidth) * 2.0 - 1,
    //   -(event.layerY / this.app.view3D.rootWebGL.offsetHeight) * 2 + 1
    // );
    // raycaster.setFromCamera(mouse3D, this.itownsView.camera.camera3D);
    // let intersects = raycaster.intersectObjects(this.bboxGeomOfGeovolumes);
    // console.log(intersects);
  }

  get innerContentHtml() {
    return /*html*/ `
    <div class="box-section">
      <div class ="box-section" id="${this.geoVolumeDivId}"> 
        <label for="geometry-layers-spoiler" class="section-title">Available GeoVolume</Label>
        <div class="spoiler-box">
          <ol id= "${this.geoVolumeListId}">
          </ol>
        </div>
      </div>
    <div>
    <div data-ext-container-default="button"></div>
    `;
  }

  visualizePointCloudContent(geovolume,content){
    const mat = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
    });
    const l3dt = new itowns.C3DTilesLayer(
      content.id,
      {
        name: content.id,
        source: new itowns.C3DTilesSource({
          url: '"../../../../../assets/tileset/villeurbanne_tileset/tileset.json',
        }),
        overrideMaterials: true,
      },
      this.itownsView
    );
    l3dt.overrideMaterials = mat;
    l3dt.material = mat;
    l3dt.clipExtent = new THREE.Box3(
      new THREE.Vector3(1845820, 5177430, -100),
      new THREE.Vector3(1845890, 5177499, 500)
    );

    itowns.View.prototype.addLayer.call(this.itownsView, l3dt);
    if(content.variantIdentifier == "extent")
      refinementFiltered(l3dt);

    
    var visualisator = document.getElementById(content.id);
    visualisator.innerHTML =
      ' <img src="/assets/icons/delete.svg" width="20px" height="20px"></img>';
    visualisator.onclick = () => {
      this.deletePointCloudContent(geovolume, content);
    };
  }

  visualize3DTilesContent(geovolume, content) {
    if (content.url == undefined) content.url = content.href;
    if (this.itownsView.getLayerById(content.id) == undefined) {
      var itownsLayer = setup3DTilesLayer(
        content,
        this.app.getFrame3DPlanar().getLayerManager(),
        this.itownsView
      );
      itowns.View.prototype.addLayer.call(this.itownsView, itownsLayer);
      var tilesManager = this.app.getFrame3DPlanar().getLayerManager().getTilesManagerByLayerID(
        content.id
      );
      tilesManager.registerStyle('hide', {
        materialProps: { opacity: 0, color: 0xffffff },
      });
      tilesManager.registerStyle('selected', {
        materialProps: { opacity: 1, color: 0x13ddef }
      });
      tilesManager.registerStyle('default', {
        materialProps: { opacity: 1, color: 0xffffff }
      });
      tilesManager.addEventListener(
        TilesManager.EVENT_TILE_LOADED,
        function () {
          if (
            content.variantIdentifier.includes("GMLID") ||
            content.variantIdentifier.includes("GUID")
          ) {
            var id = content.variantIdentifier.split("=")[1];
            for (let tile of tilesManager.tiles) {
              if (tile != undefined) {
                if (tile.cityObjects != undefined) {
                  for (let cityObject of tile.cityObjects) {
                    let toHide = true;
                    for (let prop of Object.entries(cityObject.props)) {
                      if (prop[1] == id) {
                        toHide = false;
                      }
                    }
                    if (toHide) {
                      tilesManager.setStyle(cityObject.cityObjectId, "hide");
                    }
                  }
                  tilesManager.applyStyleToTile(tile.tileId, {
                    updateFunction: tilesManager.view.notifyChange.bind(
                      tilesManager.view
                    ),
                  });
                  tilesManager.view.notifyChange();
                }
              }
            }
          } else if (
            content.variantIdentifier.includes("TileID") &&
            content.variantIdentifier.includes("Batch_ID")
          ) {
            tilesManager.addEventListener(
              TilesManager.EVENT_TILE_LOADED,
              function () {
                var keys = content.variantIdentifier.split("&");
                var tileId = keys[0].split("=")[1];
                var batchId = keys[1].split("=")[1];
                var coID = new CityObjectID(tileId, batchId);

                tilesManager.setStyleToTileset("hide");
                tilesManager.styleManager.setStyle(coID, "default");

                tilesManager.applyStyles();
                tilesManager.view.notifyChange();
              }
            );
          } else if (!content.variantIdentifier.includes("file")) {
            console.log(
              "variant accessor not handled : " + content.variantIdentifier
            );
          }
        }
      );

      var visualisator = document.getElementById(content.id);
      visualisator.innerHTML =
        ' <img src="/assets/icons/delete.svg" width="20px" height="20px"></img>';
      visualisator.onclick = () => {
        this.delete3DTilesContent(geovolume, content);
      };
    }
  }

  delete3DTilesContent(geovolume, content) {
    if (this.itownsView.getLayerById(content.id) != undefined) {
      this.app.getFrame3DPlanar().getLayerManager().remove3DTilesLayerByLayerID(content.id);
      var visualisator = document.getElementById(content.id);
      visualisator.innerHTML =
        ' <img src="/assets/icons/more.svg" width="20px" height="20px"></img>';
      visualisator.onclick = () => {
        this.visualize3DTilesContent(geovolume, content);
      };
    }
  }

  deletePointCloudContent(geovolume, content) {
    if (this.itownsView.getLayerById(content.id) != undefined) {
      this.itownsView.removeLayer(content.id);
      var visualisator = document.getElementById(content.id);
      visualisator.innerHTML =
        ' <img src="/assets/icons/more.svg" width="20px" height="20px"></img>';
      visualisator.onclick = () => {
        this.visualizePointCloudContent(geovolume, content);
      };
    }
  }

  writeGeoVolume(geovolume, htmlParent) {
    if (geovolume.id && geovolume.links) {
      var li = document.createElement("li");
      li.className = "ordered";
      var linkToSelf = "";
      for (let link of geovolume.links) {
        if (link.rel == "self") {
          linkToSelf = link.href;
        }
      }
      var a = document.createElement("a");
      a.href = linkToSelf;
      a.innerText = geovolume.id;
      li.appendChild(a);

      if (geovolume.content.length > 0) {
        li.innerHTML += "<br>    Representations : ";

        var representationsList = document.createElement("ul");
        for (let c of geovolume.content) {
          var representationEl = document.createElement("li");
          representationEl.innerHTML = c.title + " ";
          if (c.type.includes("3dtiles")) {
            let visualisator = document.createElement("a");
            visualisator.id = `${geovolume.id + "_" + c.title}`;
            c.id = geovolume.id + "_" + c.title;
            if (this.itownsView.getLayerById(c.id) == undefined) {
              visualisator.innerHTML =
                ' <img src="/assets/icons/more.svg" width="20px" height="20px"></img>';
              visualisator.onclick = () => {
                this.visualize3DTilesContent(geovolume, c);
              };
            } else {
              visualisator.innerHTML =
                ' <img src="/assets/icons/delete.svg" width="20px" height="20px"></img>';
              visualisator.onclick = () => {
                this.delete3DTilesContent(geovolume, c);
              };
            }
            representationEl.append(visualisator);
          } else if (c.type.includes("sensor")) {
            var sensorDiv = document.createElement("a");
            sensorDiv.id = `geoVolume_sensor`;
            representationEl.append(sensorDiv);
          } else if (c.type.includes("sparql")) {
            var sparqlDiv = document.createElement("a");
            sparqlDiv.className = `geoVolume_sparql`;
            sparqlDiv.setAttribute("geoVolumeId", geovolume.id);
            sparqlDiv.setAttribute("variantId", c.title);
            representationEl.append(sparqlDiv);
          }
          else if (c.type.includes("pnts"))
          {
            let visualisator = document.createElement("a");
            visualisator.id = `${geovolume.id + "_" + c.title}`;
            c.id = geovolume.id + "_" + c.title;
            if (this.itownsView.getLayerById(c.id) == undefined) {
              visualisator.innerHTML =
                ' <img src="/assets/icons/more.svg" width="20px" height="20px"></img>';
              visualisator.onclick = () => {
                this.visualizePointCloudContent(geovolume, c);
              };
            } else {
              visualisator.innerHTML =
                ' <img src="/assets/icons/delete.svg" width="20px" height="20px"></img>';
              visualisator.onclick = () => {
                this.deletePointCloudContent(geovolume, c);
              };
            }
            representationEl.append(visualisator);
          }
          representationsList.appendChild(representationEl);
        }
        li.appendChild(representationsList);
      }
      if (geovolume.children.length > 0) {
        var ol = document.createElement("ol");
        for (let child of geovolume.children) {
          this.writeGeoVolume(child, ol);
        }
        li.appendChild(ol);
      }
      htmlParent.appendChild(li);
    }
  }

  displayCollectionsInHTML() {
    if (this.geoVolumeSource.Collections) {
      let list = this.geoVolumeListElement;
      list.innerHTML = "";
      for (let geoVolume of this.geoVolumeSource.Collections)
        this.writeGeoVolume(geoVolume, list);
    }
  }

  displayGeoVolumeInScene(geoVolume) {
    geoVolume.displayBbox(this.itownsView.scene);
    this.bboxGeomOfGeovolumes.push(geoVolume.bboxGeom);
    if (geoVolume.children.length > 0) {
      for (let child of geoVolume.children) {
        this.displayCollectionsInScene(child);
      }
    }
  }

  displayCollectionsInScene() {
    for (let geoVolume of this.geoVolumeSource.Collections)
      this.displayGeoVolumeInScene(geoVolume);
  }

  windowCreated() {
    this.geoVolumeSource.getgeoVolumes().then(() => {
      this.deleteBboxGeomOfGeovolumes();
      this.displayCollectionsInHTML();
      this.displayCollectionsInScene();
      this.itownsView.notifyChange();
      this.sendEvent(GeoVolumeWindow.GEOVOLUME_COLLECTION_UPDATED);
    });      
    }

  deleteBboxGeomOfGeovolumes() {
    for (let bbox of this.bboxGeomOfGeovolumes) {
      this.itownsView.scene.remove(bbox);
    }
  }

  windowDestroyed() {
    this.app.viewerDivElement.removeEventListener(
      "mousedown",
      this.clickListener
    );
    this.deleteBboxGeomOfGeovolumes();
  }

  get getCollectionsButtonId() {
    return `${this.windowId}_get_collections_button`;
  }

  get getCollectionsButtonIdElement() {
    return document.getElementById(this.getCollectionsButtonId);
  }

  get getCollectionsByExtentButtonId() {
    return `${this.windowId}_get_collections_by_extent_button`;
  }

  get getCollectionsByExtentButtonIdElement() {
    return document.getElementById(this.getCollectionsByExtentButtonId);
  }

  get geoVolumeDivId() {
    return `${this.windowId}_geovolume_div`;
  }

  get geoVolumeListId() {
    return `${this.windowId}_geovolume_list`;
  }

  get geoVolumeListElement() {
    return document.getElementById(this.geoVolumeListId);
  }

  static get GEOVOLUME_COLLECTION_UPDATED() {
    return "GEOVOLUME_COLLECTION_UPDATED";
  }
}
