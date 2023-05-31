import {
  itowns,
  THREE,
  createC3DTilesLayer,
  THREEUtil,
  findChildByID,
} from "@ud-viz/browser";
import { EventSender } from "@ud-viz/shared";

import { refinementFiltered } from "../../Utils/Refinement";
export class GeoVolumeWindow extends EventSender {
  constructor(geoVolumeSource, frame3DPlanar) {
    super();
    /** @type {HTMLElement} */
    this.rootHtml = document.createElement("div");
    this.rootHtml.innerHTML = this.innerContentHtml;
    this.rootHtml.id = "geovolume";
    this.rootHtml.className = "w3-round-xlarge";
    this.geoVolumeSource = geoVolumeSource;
    this.selectedGeoVolume = null;
    this.itownsView = frame3DPlanar.getItownsView();
    this.frame3DPlanar = frame3DPlanar;

    this.mouseClickListener = (event) => {
      this.onMouseClick(event);
    };
    frame3DPlanar.rootWebGL.addEventListener(
      "mousedown",
      this.mouseClickListener
    );

    this.registerEvent(GeoVolumeWindow.GEOVOLUME_COLLECTION_UPDATED);
    frame3DPlanar.appendToUI(this.html());
  }

  onMouseClick(event) {
    event.preventDefault();
    let raycaster = new THREE.Raycaster();
    let mouse3D = new THREE.Vector2(
      (event.layerX / this.frame3DPlanar.rootWebGL.offsetWidth) * 2.0 - 1,
      -(event.layerY / this.frame3DPlanar.rootWebGL.offsetHeight) * 2.0 + 1
    );
    raycaster.setFromCamera(mouse3D, this.itownsView.camera.camera3D);
    let intersects = raycaster.intersectObjects(
      this.geoVolumeSource.getVisibleGeoVolumesBboxGeom()
    );
    if (intersects.length > 0) {
      this.displayGeoVolumeInHTML(intersects[0].object.geoVolume);
      for (let visibleBbox of this.geoVolumeSource.getVisibleGeoVolumesBboxGeom()) {
        visibleBbox.geoVolume.hideBbox(this.itownsView.scene);
      }
      intersects[0].object.geoVolume.displayBbox(this.itownsView.scene);
      this.selectedGeoVolume = intersects[0].object.geoVolume;
      this.itownsView.notifyChange();
    }
  }

  html() {
    this.geoVolumeSource.getgeoVolumes().then(() => {
      this.deleteBboxGeomOfGeovolumes();
      this.displayCollectionsInHTML();
      this.displayCollectionsInScene();
      this.itownsView.notifyChange();
      this.sendEvent(GeoVolumeWindow.GEOVOLUME_COLLECTION_UPDATED);
    });
    return this.rootHtml;
  }

  dispose() {
    this.rootHtml.remove();
    this.removeListener();
  }

  get innerContentHtml() {
    return /*html*/ `
      <div class ="box-section" id="${this.geoVolumeDivId}"> 
        <div id= "${this.geoVolumeListId}">
        </div>
    `;
  }

  visualizePointCloudContent(geovolume, content) {
    const mat = new THREE.PointsMaterial({
      size: 1,
      vertexColors: true,
    });
    const l3dt = new itowns.C3DTilesLayer(
      content.id,
      {
        name: content.id,
        source: new itowns.C3DTilesSource({
          url: content['href'],
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
    if (content.variantIdentifier == "extent") refinementFiltered(l3dt);

    var visualisator = document.getElementById(content.id);
    visualisator.firstChild.src = "../assets/icons/eye-slash.svg";
    visualisator.onclick = () => {
      this.delete3DTilesContent(geovolume, content, false);
    };
  }

  visualize3DTilesContent(geovolume, content) {
    if (content.url == undefined) content.url = content.href;

    if (this.itownsView.getLayerById(content.id) == undefined) {
      var itownsLayer = createC3DTilesLayer(content, this.itownsView);
      itowns.View.prototype.addLayer.call(this.itownsView, itownsLayer);
      // this.itownsView
      //   .getLayerById(content.id)
      //   .addEventListener(
      //     itowns.C3DTILES_LAYER_EVENTS.ON_TILE_CONTENT_LOADED,
      //     (tileContent) => {
      //       THREEUtil.appendWireframeByGeometryAttributeToObject3D(
      //         tileContent,
      //         "_BATCHID"
      //       );
      //     }
      //   );
      var gml_id = content.variantIdentifier.split("=")[1];
      if (content.variantIdentifier.includes("TileID")) {
        var keys = content.variantIdentifier.split("&");
        var tileId = keys[0].split("=")[1];
        var batchId = keys[1].split("=")[1];
      }
      const myStyle = new itowns.Style({
        fill: {
          color: function () {
            return "white";
          },
          opacity: function (feature) {
            if (
              content.variantIdentifier.includes("GMLID") &&
              feature.getInfo().batchTable.gml_id == gml_id
            )
              return 1;
            if (
              content.variantIdentifier.includes("TileID") &&
              feature.tileId == tileId &&
              feature.batchId == batchId
            )
              return 1;

            if (content.variantIdentifier == "file") return 1;
            return 0;
          },
        },
      });

      this.itownsView.getLayerById(content.id).style = myStyle;

      var visualisator = document.getElementById(content.id);
      visualisator.firstChild.src = "../assets/icons/eye-slash.svg";
      visualisator.onclick = () => {
        this.delete3DTilesContent(geovolume, content);
      };
    }
  }

  hideOutliers(tile) {
    let lineGeometry = tile.getObject3D().children[0].children[0].children[0];
    let transparentMat = new THREE.LineBasicMaterial({ color: 0x000000 });
    transparentMat.transparent = true;
    transparentMat.opacity = 0;
    lineGeometry.material = transparentMat;
    lineGeometry.geometry.material = transparentMat;
  }

  delete3DTilesContent(geovolume, content, isPc = false) {
    if (this.itownsView.getLayerById(content.id) != undefined) {
      this.itownsView.removeLayer(content.id);
      var visualisator = document.getElementById(content.id);
      visualisator.firstChild.src = "../assets/icons/eye.svg";
      visualisator.onclick = () => {
        if(isPc)
          this.visualizePointCloudContent(geovolume, content);
        else
          this.visualize3DTilesContent(geovolume, content);
      };
    }
  }

  createShowButton(visible,c,geovolume, isPc = false){
    let visualisator = document.createElement("button");
    visualisator.className = "w3-btn w3-round";
    visualisator.id = `${c.id}`;
    var logo = document.createElement("img");
    logo.src = visible ? "../assets/icons/eye.svg" : "../assets/icons/eye-slash.svg";
    logo.width = "20";
    visualisator.appendChild(logo);
    visualisator.onclick = () => {
      if(visible)
        if(isPc)
          this.visualizePointCloudContent(geovolume, c);
        else
          this.visualize3DTilesContent(geovolume,c);
      else
        this.delete3DTilesContent(geovolume, c);
    };
    return visualisator;
  }

  writeGeoVolume(geovolume, htmlParent) {
    if (geovolume.id && geovolume.links) {
      var li = document.createElement("div");
      var linkToSelf = "";
      for (let link of geovolume.links) {
        if (link.rel == "self") {
          linkToSelf = link.href;
        }
      }
      var div_name = document.createElement("div");
      div_name.innerText = "Real World Object : ";
      var a = document.createElement("a");
      a.href = linkToSelf;
      a.innerText = geovolume.id;
      div_name.appendChild(a);
      li.appendChild(div_name);

      if (geovolume.children.length > 0) {
        var childrenButton = document.createElement("button");
        childrenButton.className = "w3-btn w3-gray w3-round";
        childrenButton.innerHTML = "Show Children";
        childrenButton.onclick = () => {
          geovolume.hideBbox(this.itownsView.scene);
          for (let children of geovolume.children) {
            children.displayBbox(this.itownsView.scene);
          }
          this.itownsView.notifyChange();
        };
        li.appendChild(childrenButton);
      }

      var bboxButton = document.createElement("button");
      bboxButton.className = "w3-btn w3-gray w3-round";
      bboxButton.innerHTML = "Show Bounding box";
      bboxButton.onclick = () => {
          geovolume.changeBboxVisibility(this.itownsView.scene);
          this.itownsView.notifyChange();
        };
        li.appendChild(bboxButton);
    
      if (geovolume.content.length > 0) {
        var representationsList = document.createElement("ul");
        representationsList.className = "w3-ul";
        for (let c of geovolume.content) {
          var representationEl = document.createElement("li");
          representationEl.innerHTML = c.title + " ";
          c.id = geovolume.id + "_" + c.title;
          if (c.type.includes("3dtiles")) {
            let visualisator = this.createShowButton(this.itownsView.getLayerById(c.id) == undefined,c,geovolume);
            representationEl.append(visualisator);
          } else if (c.type.includes("pnts")) {
            let visualisator = this.createShowButton(this.itownsView.getLayerById(c.id) == undefined,c,geovolume,true);
            representationEl.append(visualisator);            
          }else if (c.type.includes("sensor")) {
            var sensorDiv = document.createElement("a");
            sensorDiv.id = "geoVolume_sensor";
            representationEl.append(sensorDiv);
          } else if (c.type.includes("sparql")) {
            var sparqlDiv = document.createElement("a");
            sparqlDiv.className = "geoVolume_sparql";
            sparqlDiv.setAttribute("geoVolumeId", geovolume.id);
            sparqlDiv.setAttribute("variantId", c.title);
            representationEl.append(sparqlDiv);
          } 
          representationsList.appendChild(representationEl);
        }
        li.appendChild(representationsList);
      }

      // if (geovolume.children.length > 0) {
      //   var ol = document.createElement('ol');
      //   for (let child of geovolume.children) {
      //     this.writeGeoVolume(child, ol);
      //   }
      //   li.appendChild(ol);
      // }

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

  displayGeoVolumeInHTML(geoVolume) {
    let list = this.geoVolumeListElement;
    list.innerHTML = "";
    this.writeGeoVolume(geoVolume, list);
    this.sendEvent(GeoVolumeWindow.GEOVOLUME_COLLECTION_UPDATED);
  }

  displayGeoVolumeInScene(geoVolume) {
    geoVolume.displayBbox(this.itownsView.scene);
  }

  displayCollectionsInScene() {
    for (let geoVolume of this.geoVolumeSource.Collections)
      this.displayGeoVolumeInScene(geoVolume);
  }

  deleteBboxGeomOfGeovolumes() {
    for (let geoVolume of this.geoVolumeSource.Collections)
      geoVolume.deleteBbox(this.itownsView.scene);
  }

  windowDestroyed() {
    this.app.viewerDivElement.removeEventListener(
      "mousedown",
      this.clickListener
    );
    this.deleteBboxGeomOfGeovolumes();
    this.itownsView.notifyChange();
  }

  get getCollectionsButtonId() {
    return `get_collections_button`;
  }

  get getCollectionsButtonIdElement() {
    return findChildByID(this.rootHtml, this.getCollectionsButtonId);
  }

  get getCollectionsByExtentButtonId() {
    return `get_collections_by_extent_button`;
  }

  get getCollectionsByExtentButtonIdElement() {
    return findChildByID(this.rootHtml, this.getCollectionsByExtentButtonId);
  }

  get geoVolumeDivId() {
    return `geovolume_div`;
  }

  get geoVolumeListId() {
    return `geovolume_list`;
  }

  get geoVolumeListElement() {
    return findChildByID(this.rootHtml, this.geoVolumeListId);
  }

  static get GEOVOLUME_COLLECTION_UPDATED() {
    return "GEOVOLUME_COLLECTION_UPDATED";
  }
}
