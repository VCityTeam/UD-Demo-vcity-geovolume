import { Widgets, Components, itowns, THREE } from "ud-viz";
import { CityObjectID } from "ud-viz/src/Components/3DTiles/Model/CityObject";
import { TilesManager } from "ud-viz/src/Components/Components";
import { refinementFiltered } from "../../Utils/Refinement";
// import { SensorExtension } from '../../../Sensor/SensorExtension';
export class GeoVolumeWindow extends Widgets.Components.GUI.Window {
  constructor(geoVolumeSource, allWidget) {
    super("geovolumeWindow", "GeoVolume", false);
    this.geoVolumeSource = geoVolumeSource;
    this.view = allWidget.view3D.getItownsView();
    this.app = allWidget;
    this.bboxGeomOfGeovolumes = new Array();

    let clickListener = (event) => {
      this.onMouseClick(event);
    };
    this.app.viewerDivElement.addEventListener("mousedown", clickListener);
    console.log(this.view);

    this.registerEvent(GeoVolumeWindow.GEOVOLUME_COLLECTION_UPDATED);
  }

  onMouseClick(event) {
    // event.preventDefault();
    // let raycaster = new THREE.Raycaster();
    // let mouse3D = new THREE.Vector2(
    //   (event.layerX / this.app.view3D.rootWebGL.offsetWidth) * 2.0 - 1,
    //   -(event.layerY / this.app.view3D.rootWebGL.offsetHeight) * 2 + 1
    // );
    // raycaster.setFromCamera(mouse3D, this.view.camera.camera3D);
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

  visualizeContent(geovolume, content) {
    if (content.url == undefined) content.url = content.href;
    if (this.app.view3D.itownsView.getLayerById(content.id) == undefined) {
      var itownsLayer = Components.setup3DTilesLayer(
        content,
        this.app.view3D.layerManager,
        this.view
      );
      itowns.View.prototype.addLayer.call(this.view, itownsLayer);
      var tilesManager = this.app.view3D.layerManager.getTilesManagerByLayerID(
        content.id
      );
      tilesManager.registerStyle("hide", {
        materialProps: { opacity: 0, color: 0xffffff },
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
        this.deleteContent(geovolume, content);
      };
    }
  }

  deleteContent(geovolume, content) {
    if (this.app.view3D.itownsView.getLayerById(content.id) != undefined) {
      this.app.view3D.layerManager.removeLayerByLayerID(content.id);
      var visualisator = document.getElementById(content.id);
      visualisator.innerHTML =
        ' <img src="/assets/icons/more.svg" width="20px" height="20px"></img>';
      visualisator.onclick = () => {
        this.visualizeContent(geovolume, content);
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
            var visualisator = document.createElement("a");
            visualisator.id = `${geovolume.id + "_" + c.title}`;
            c.id = geovolume.id + "_" + c.title;
            if (this.app.view3D.itownsView.getLayerById(c.id) == undefined) {
              visualisator.innerHTML =
                ' <img src="/assets/icons/more.svg" width="20px" height="20px"></img>';
              visualisator.onclick = () => {
                this.visualizeContent(geovolume, c);
              };
            } else {
              visualisator.innerHTML =
                ' <img src="/assets/icons/delete.svg" width="20px" height="20px"></img>';
              visualisator.onclick = () => {
                this.deleteContent(geovolume, c);
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
    geoVolume.displayBbox(this.view.scene);
    this.bboxGeomOfGeovolumes.push(geoVolume.bboxGeom);
    if (geoVolume.children.length > 0) {
      for (let child of geoVolume.children) {
        this.displayCollectionsInScene(child);
      }
    }
    this.app.update3DView();
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
      this.sendEvent(GeoVolumeWindow.GEOVOLUME_COLLECTION_UPDATED);
    });

    console.log(this.view);

    // let potreeLayer = new itowns.PotreeLayer("test", {
    //   source: new itowns.PotreeSource({
    //     version : "2.0",
    //     file: "cloud.js",
    //     url: "../../../../../assets/data",
    //     crs: this.view.referenceCrs,
    //   }),
    // });

    // function onLayerReady(){
    //   console.log(potreeLayer);
    //   potreeLayer.pointSize = 3;
    //   console.log(potreeLayer.object3d.children[0]);
    // }


      
    // const mat = new THREE.PointsMaterial({
    //   size: 2,
    //   vertexColors: true,
    // });
    // let vectormax = new THREE.Vector3(1845820, 5177430, -100);
    // let vectormin = new THREE.Vector3(1845890, 5177499, 500);

    // mat.onBeforeCompile = function(shader) {
    //   console.log("hello");
    // //   shader.uniforms.vectormax = mat.userData.vectormax;
    // //   shader.uniforms.vectormin = mat.userData.vectormin;
    // //   shader.vertexShader = shader.vertexShader.replace(
    // //     'void main() {',
    // //     'uniform vec3 vectormax;\nvoid main() {'
    // //   );
    //   // shader.vertexShader =
    //   //   'uniform vec3 vectormax;\nuniform vec3 vectormin;\n' +
    //   //   shader.vertexShader;
    // };
    // mat.needsUpdate = true;


    // console.log(mat);

    // const l3dt = new itowns.C3DTilesLayer(
    //   "3dtiles",
    //   {
    //     name: "3dtl",
    //     source: new itowns.C3DTilesSource({
    //       url: '"../../../../../assets/tileset/fusion/tileset.json',
    //     }),
    //     overrideMaterials: true,
    //   },
    //   this.view
    // );
    // l3dt.overrideMaterials = mat;
    // l3dt.material = mat;
    // l3dt.clipExtent = new THREE.Box3(
    //   new THREE.Vector3(1845820, 5177430, -100),
    //   new THREE.Vector3(1845890, 5177499, 500)
    // );

    // itowns.View.prototype.addLayer.call(this.view, l3dt);
    // refinementFiltered(l3dt);
  }

  deleteBboxGeomOfGeovolumes() {
    for (let bbox of this.bboxGeomOfGeovolumes) {
      this.view.scene.remove(bbox);
    }
  }

  windowDestroyed() {
    this.app.viewerDivElement.removeEventListener(
      "mousedown",
      this.clickListener
    );
    this.deleteBboxGeomOfGeovolumes();
    this.app.update3DView();
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
