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
    this.itownsView = frame3DPlanar.itownsView;
    this.frame3DPlanar = frame3DPlanar;

    this.mouseClickListener = (event) => {
      this.onMouseClick(event);
    };
    frame3DPlanar.domElementWebGL.addEventListener(
      "mousedown",
      this.mouseClickListener
    );

    this.registerEvent(GeoVolumeWindow.GEOVOLUME_COLLECTION_UPDATED);
    this.registerEvent(GeoVolumeWindow.GEOVOLUME_SHOWN);
    this.registerEvent(GeoVolumeWindow.SELECTED_GEOVOLUME_UPDATED);
    frame3DPlanar.domElementUI.appendChild(this.html());

    this.addEventListener(
      GeoVolumeWindow.SELECTED_GEOVOLUME_UPDATED,
      (geovolume) => {
        this.changeDisplayedGeovolume(geovolume);
      }
    );
  }

  focusGeovolume() {
    if (this.selectedGeoVolume) {
      let box3 = new THREE.Box3().setFromObject(this.selectedGeoVolume.bboxGeom);
      let size = new THREE.Vector3();
      box3.getSize(size);
      const maxDim = Math.max(size.x, size.y);
      const fov = this.itownsView.camera.camera3D.fov * (Math.PI / 180);
      let cameraZ = (maxDim / 2 / Math.tan(fov / 2)) * 1.2;

      let position = new THREE.Vector3(
        this.selectedGeoVolume.centroid[0],
        this.selectedGeoVolume.centroid[1],
        box3.max.z + cameraZ
      );
      let angle = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(1, 0, 0),
        0
      );
      this.itownsView.controls.initiateTravel(position, "auto", angle, true);
    }
  }

  changeDisplayedGeovolume(geovolume) {
    if (!this.selectedGeoVolume || geovolume.id != this.selectedGeoVolume.id) {
      this.displayGeoVolumeInHTML(geovolume);

      for (let visibleBbox of this.geoVolumeSource.getVisibleGeoVolumesBboxGeom()) {
        visibleBbox.geoVolume.hideBbox(this.itownsView.scene);
      }
      this.selectedGeoVolume = geovolume;
      this.selectedGeoVolume.showBbox();
      this.itownsView.notifyChange();
      this.focusGeovolume(this.selectedGeoVolume);
    }
  }

  onMouseClick(event) {
    event.preventDefault();
    let raycaster = new THREE.Raycaster();
    let mouse3D = new THREE.Vector2(
      (event.layerX / this.frame3DPlanar.domElementWebGL.offsetWidth) * 2.0 - 1,
      -(event.layerY / this.frame3DPlanar.domElementWebGL.offsetHeight) * 2.0 +
        1
    );
    raycaster.setFromCamera(mouse3D, this.itownsView.camera.camera3D);
    let intersects = raycaster.intersectObjects(
      this.geoVolumeSource.getVisibleGeoVolumesBboxGeom()
    );
    if (intersects.length > 0) {
      if (
        !this.selectedGeoVolume ||
        intersects[0].object.geoVolume.id != this.selectedGeoVolume.id
      ) {
        this.sendEvent(
          GeoVolumeWindow.SELECTED_GEOVOLUME_UPDATED,
          intersects[0].object.geoVolume
        );
      }
      this.focusGeovolume();
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

  get innerContentHtml() {
    return /*html*/ `
      <div class ="box-section" id="${this.geoVolumeDivId}"> 
        <div id= "${this.geoVolumeListId}">
        </div>
    `;
  }

  visualizePointCloudContent(content) {
    const l3dt = new itowns.C3DTilesLayer(
      content.id,
      {
        name: content.id,
        source: new itowns.C3DTilesSource({
          url: content["href"],
        }),
      },
      this.itownsView
    );
    l3dt.clipExtent = new THREE.Box3(
      new THREE.Vector3(1845820, 5177430, -100),
      new THREE.Vector3(1845890, 5177499, 500)
    );

    itowns.View.prototype.addLayer.call(this.itownsView, l3dt);

    if (content.variantIdentifier == "extent") {
      refinementFiltered(l3dt);
      l3dt.addEventListener(
        itowns.C3DTILES_LAYER_EVENTS.ON_TILE_CONTENT_LOADED,
        ({ tileContent }) => {
          tileContent.traverse((child) => {
            if (child.geometry && child.geometry.isBufferGeometry) {
              child.material.size = 0.5;
            }
          });
        }
      );
    }
  }

  appendWireframe(object3D, threshOldAngle = 30, variantIdentifier) {
    var gml_id = variantIdentifier.split("=")[1];
    if (variantIdentifier.includes("TileID")) {
      var keys = variantIdentifier.split("&");
      var variant_tileId = keys[0].split("=")[1];
      var variant_batchId = keys[1].split("=")[1];
    }
    if (
      !isNaN(object3D.tileId) &&
      object3D.tileId >= 0 &&
      object3D.layer.tilesC3DTileFeatures.has(object3D.tileId)
    ) {
      object3D.traverse((child) => {
        if (
          child.geometry &&
          child.geometry.isBufferGeometry &&
          !child.userData.isWireframe &&
          !child.userData.hasWireframe
        ) {
          // This event can be triggered multiple times, even when the geometry is loaded.
          // This bool avoid to create multiple wireframes for one geometry
          child.userData.hasWireframe = true;

          for (const [
            // eslint-disable-next-line no-unused-vars
            batchId,
            c3DTFeature,
          ] of object3D.layer.tilesC3DTileFeatures.get(object3D.tileId)) {
            if (
              (variantIdentifier.includes("GMLID") &&
                c3DTFeature.getInfo().batchTable.gml_id == gml_id) ||
              (variantIdentifier.includes("TileID") &&
                c3DTFeature.tileId == variant_tileId &&
                c3DTFeature.batchId == variant_batchId)
            ) {
              let positionByAttribute = new THREE.BufferAttribute(
                child.geometry.attributes.position.array.slice(
                  c3DTFeature.groups[0].start * 3,
                  (c3DTFeature.groups[0].start + c3DTFeature.groups[0].count) *
                    3 +
                    1
                ),
                3
              );
              const mesh = new THREE.BufferGeometry();
              mesh.setAttribute("position", positionByAttribute);

              // THREE.EdgesGeometry needs triangle indices to be created.
              // Create a new array for the indices
              const indices = [];

              // Iterate over every group of three vertices in the unindexed mesh and add the corresponding indices to the indices array
              for (let j = 0; j < mesh.attributes.position.count; j += 3) {
                indices.push(j, j + 1, j + 2);
              }
              mesh.setIndex(indices);

              // Create the wireframe geometry
              const edges = new THREE.EdgesGeometry(mesh, threshOldAngle);

              const mat = new THREE.LineBasicMaterial({ color: 0x000000 });
              const wireframe = new THREE.LineSegments(edges, mat);
              wireframe.userData.isWireframe = true;
              child.add(wireframe);
            }
          }
        }
      });
    }
  }

  visualize3DTilesContent(content) {
    if (content.url == undefined) content.url = content.href;

    if (this.itownsView.getLayerById(content.id) == undefined) {
      var gml_id = content.variantIdentifier.split("=")[1];
      if (content.variantIdentifier.includes("TileID")) {
        var keys = content.variantIdentifier.split("&");
        var tileId = keys[0].split("=")[1];
        var batchId = keys[1].split("=")[1];
      }

      var itownsLayer = createC3DTilesLayer(content, this.itownsView);
      itowns.View.prototype.addLayer.call(this.itownsView, itownsLayer);

      if (
        content.variantIdentifier.includes("TileID") ||
        content.variantIdentifier.includes("GMLID")
      ) {
        this.itownsView
          .getLayerById(content.id)
          .addEventListener(
            itowns.C3DTILES_LAYER_EVENTS.ON_TILE_CONTENT_LOADED,
            ({ tileContent }) => {
              this.appendWireframe(tileContent, 30, content.variantIdentifier);
            }
          );
      } else {
        this.itownsView
          .getLayerById(content.id)
          .addEventListener(
            itowns.C3DTILES_LAYER_EVENTS.ON_TILE_CONTENT_LOADED,
            ({ tileContent }) => {
              THREEUtil.appendWireframeToObject3D(tileContent);
            }
          );
      }

      const myStyle = new itowns.Style({
        fill: {
          color: function () {
            return "grey";
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
    }
  }

  delete3DTilesContent(content) {
    if (this.itownsView.getLayerById(content.id) != undefined) {
      this.itownsView.removeLayer(content.id);
    }
  }

  createShowButton(c, isPc = false) {
    let visualisator = document.createElement("button");
    visualisator.className =
      "w3-btn w3-medium w3-bar-item w3-round w3-border w3-right";
    visualisator.id = `${c.id}`;
    var logo = document.createElement("img");
    logo.src =
      this.itownsView.getLayerById(c.id) == undefined
        ? "../assets/icons/eye.svg"
        : "../assets/icons/eye-slash.svg";
    logo.width = "20";
    visualisator.appendChild(logo);
    visualisator.onclick = () => {
      if (this.itownsView.getLayerById(c.id) == undefined) {
        visualisator.classList.add("w3-grey");
        logo.src = "../assets/icons/eye-slash.svg";
        if (isPc) this.visualizePointCloudContent(c);
        else this.visualize3DTilesContent(c);
      } else {
        visualisator.classList.remove("w3-grey");
        logo.src = "../assets/icons/eye.svg";
        this.delete3DTilesContent(c);
      }
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

      if (geovolume.parent) {
        var button_parent = document.createElement("button");
        button_parent.className = "w3-btn w3-round w3-border";
        logo = document.createElement("img");
        logo.src = "../assets/icons/return.svg";
        logo.width = "20";
        button_parent.appendChild(logo);
        button_parent.onclick = () => {
          this.sendEvent(
            GeoVolumeWindow.SELECTED_GEOVOLUME_UPDATED,
            geovolume.parent
          );
        };
        li.appendChild(button_parent);
      }

      var div_name = document.createElement("div");
      div_name.innerText = "Real World Object : ";
      var a = document.createElement("a");
      a.href = linkToSelf;
      a.innerText = geovolume.id;
      div_name.appendChild(a);
      li.appendChild(div_name);

      var bboxButton = document.createElement("button");
      var childrenButton = document.createElement("button");

      bboxButton.className = "w3-btn w3-round w3-grey w3-border ";
      logo = document.createElement("img");
      logo.src = "../assets/icons/cube.svg";
      logo.width = "20";
      bboxButton.appendChild(logo);
      bboxButton.onclick = () => {
        if (geovolume.bboxGeom.visible) bboxButton.classList.remove("w3-grey");
        else bboxButton.classList.add("w3-grey");
        geovolume.changeBboxVisibility();
        if (geovolume.children[0] && geovolume.children[0].bboxGeom.visible) {
          childrenButton.classList.remove("w3-grey");
          for (let children of geovolume.children) {
            children.hideBbox();
          }
        }
        this.itownsView.notifyChange();
      };
      li.appendChild(bboxButton);

      if (geovolume.children.length > 0) {
        for (let children of geovolume.children) {
          children.displayBbox(this.itownsView.scene);
          children.changeBboxVisibility();
        }
        childrenButton.className = "w3-btn w3-round w3-border ";
        var logo = document.createElement("img");
        logo.src = "../assets/icons/hierarchy.svg";
        logo.width = "20";
        childrenButton.appendChild(logo);
        childrenButton.onclick = () => {
          if (geovolume.children[0].bboxGeom.visible)
            childrenButton.classList.remove("w3-grey");
          else {
            childrenButton.classList.add("w3-grey");
            geovolume.hideBbox();
            bboxButton.classList.remove("w3-grey");
          }
          for (let children of geovolume.children) {
            children.changeBboxVisibility();
          }
          this.itownsView.notifyChange();
        };
        li.appendChild(childrenButton);
      }

      if (geovolume.content.length > 0) {
        var representationsList = document.createElement("ul");
        representationsList.className = "w3-ul";
        for (let c of geovolume.content) {
          c.id = geovolume.id + "_" + c.title;
          var representationEl = document.createElement("li");
          representationEl.id = c.id;
          representationEl.className = "w3-bar";
          var a_name = document.createElement("a");
          a_name.innerText = c.title;
          a_name.className = "w3-bar-item";
          representationEl.appendChild(a_name);
          if (c.type.includes("3dtiles")) {
            let visualisator = this.createShowButton(c);
            representationEl.append(visualisator);
          } else if (c.type.includes("pnts")) {
            let visualisator = this.createShowButton(c, true);
            representationEl.append(visualisator);
          } else if (c.type.includes("sensor")) {
            var sensorDiv = document.createElement("a");
            sensorDiv.id = "geoVolume_sensor";
            representationEl.append(sensorDiv);
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
      this.sendEvent(GeoVolumeWindow.GEOVOLUME_SHOWN, geovolume);
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

  displayCollectionsInScene() {
    for (let geoVolume of this.geoVolumeSource.Collections)
      geoVolume.displayBbox(this.itownsView.scene);
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

  static get GEOVOLUME_SHOWN() {
    return "GEOVOLUME_SHOWN";
  }
  static get SELECTED_GEOVOLUME_UPDATED() {
    return "SELECTED_GEOVOLUME_UPDATED";
  }
}
