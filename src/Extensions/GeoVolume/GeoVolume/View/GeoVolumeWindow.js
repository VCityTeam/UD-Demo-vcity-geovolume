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

    this.registerEvent(GeoVolumeWindow.GEOVOLUME_COLLECTION_UPDATED);
    this.registerEvent(GeoVolumeWindow.GEOVOLUME_SHOWN);
    this.registerEvent(GeoVolumeWindow.SELECTED_GEOVOLUME_UPDATED);

    this.addEventListener(
      GeoVolumeWindow.SELECTED_GEOVOLUME_UPDATED,
      (geovolume) => {
        this.frame3DPlanar.itownsView.resize();
        this.changeDisplayedGeovolume(geovolume);
      }
    );

    frame3DPlanar.rootHtml.appendChild(this.html());

    this.mouseClickListener = (event) => {
      this.onMouseClick(event);
      this.frame3DPlanar.itownsView.resize();
    };
    frame3DPlanar.rootWebGL.addEventListener(
      "mousedown",
      this.mouseClickListener
    );

    this.itownsView.addEventListener(itowns.PLANAR_CONTROL_EVENT.MOVED, () => {
      this.updateLOD();
    });

    this.lodRangeMinElement.addEventListener("input", () => {
      this.lodRangeMinOutputElement.innerText = this.lodRangeMinElement.value;
    });
    this.lodRangeMaxElement.addEventListener("input", () => {
      this.lodRangeMaxOutputElement.innerText = this.lodRangeMaxElement.value;
    });
  }

  sort_content(method, contents) {
    let sorted_contents = [];
    for (let c of contents) {
      if (c.extras) sorted_contents.push(c);
    }
    sorted_contents.sort(function (a, b) {
      if (a.extras.nb_points > b.extras.nb_points) return 1;
      if (a.extras.nb_points < b.extras.nb_points) return -1;
      else return 0;
    });
    return sorted_contents;
  }

  updateLOD() {
    if (this.selectedGeoVolume) {
      let sorted_contents = this.sort_content(
        "points",
        this.selectedGeoVolume.content
      );
      let width = Math.round(
        this.itownsView.getPixelsToMeters(this.itownsView.camera.width)
      );
      let current_scale = Math.round(Math.log2(40075008 / width)) + 1;
      let min_scale = this.lodRangeMinElement.value;
      let max_scale = this.lodRangeMaxElement.value;
      this.lodRangeOutputElement.value =
        Math.round(
          Math.log2(
            40075008 /
              (this.selectedGeoVolume.extent.spatial.bbox[3] -
                this.selectedGeoVolume.extent.spatial.bbox[0])
          )
        ) + 1;
      if (current_scale > min_scale && current_scale < max_scale) {
        let relative_scale =
          (current_scale - min_scale) / (max_scale - min_scale);
        let c =
          sorted_contents[Math.floor(relative_scale * sorted_contents.length)];
        if (this.itownsView.getLayerById(c.id) == undefined) {
          this.deleteContents(this.selectedGeoVolume);
        }
        if (c.type.includes("3dtiles")) {
          this.visualize3DTilesContent(c);
        } else if (c.type.includes("pnts")) {
          this.visualizePointCloudContent(c);
        }
        this.updateShowButton(c);
      } else {
        this.deleteContents(this.selectedGeoVolume);
      }
    }
  }
  focusGeovolume() {
    if (this.selectedGeoVolume) {
      let box3 = new THREE.Box3().setFromObject(
        this.selectedGeoVolume.bboxGeom
      );
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
      if (this.selectedGeoVolume) {
        this.selectedGeoVolume.deleteBbox(this.itownsView.scene);
        this.deleteContents(this.selectedGeoVolume);
      }
      this.selectedGeoVolume = geovolume;
      this.selectedGeoVolume.displayBbox(this.itownsView.scene);
      this.selectedGeoVolume.showBbox();
      for (let children of this.selectedGeoVolume.children) {
        children.displayBbox(this.itownsView.scene);
        children.hideBbox();
      }
      this.itownsView.notifyChange();
      this.focusGeovolume(this.selectedGeoVolume);
    }
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
      if (
        !this.selectedGeoVolume ||
        intersects[0].object.geoVolume.id != this.selectedGeoVolume.id
      ) {
        this.sendEvent(
          GeoVolumeWindow.SELECTED_GEOVOLUME_UPDATED,
          intersects[0].object.geoVolume
        );
        this.focusGeovolume();
      }
    }
  }

  html() {
    this.geoVolumeSource.getgeoVolumes().then(() => {
      this.sendEvent(
        GeoVolumeWindow.SELECTED_GEOVOLUME_UPDATED,
        this.geoVolumeSource.collection[0].children[1].children[0]
      );
      this.itownsView.notifyChange();
    });
    return this.rootHtml;
  }

  get innerContentHtml() {
    return /*html*/ `
      <div class ="box-section" id="${this.geoVolumeDivId}"> 
        <div id= "${this.geoVolumeListId}"></div>
        <div id= "${this.geoVolumeLODId}" class="geovolume-el">
          LOD
          <div>
          Scale : <output id="output_scale">2</output>
          </div>
          <div style="position:relative;">
          <label for="LOD-range-max">Scale max : </label>
          <output id="output_scale_max">22</output>
          <input type="range" class="lod-range" id="LOD-range-max" min="0" max="26" step="1" value="22"/>
          </div>
          <div style="position:relative;">
          <label for="LOD-range-min">Scale min : </label>
          <output id="output_scale_min">15</output>
          <input type="range" class="lod-range" id="LOD-range-min" min="0" max="26" step="1" value="15"/>
          </div>

          <div>
            <label for="LOD-select">Sort by : </label>
            <select id="LOD-select" class="my-select">
              <option value="points">Number of points</option>
              <option value="max">Max distance</option>
              <option value="min">Min distance</option>
              <option value="feature">Number of feature</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  visualizePointCloudContent(content) {
    if (this.itownsView.getLayerById(content.id) == undefined) {
      const l3dt = new itowns.C3DTilesLayer(
        content.id,
        {
          name: content.id,
          pntsSizeMode: 2,
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
                child.material.size = 3;
                let pos_world = child.geometry.attributes.position.clone();
                pos_world.applyMatrix4(child.matrixWorld);
                let new_pos = [];
                let new_color = [];
                for (let i = 0; i < pos_world.count; i++) {
                  let pos = new THREE.Vector3().fromBufferAttribute(
                    pos_world,
                    i
                  );
                  if (l3dt.clipExtent.containsPoint(pos)) {
                    new_pos.push(
                      child.geometry.attributes.position.array[3 * i]
                    );
                    new_pos.push(
                      child.geometry.attributes.position.array[3 * i + 1]
                    );
                    new_pos.push(
                      child.geometry.attributes.position.array[3 * i + 2]
                    );
                    new_color.push(
                      child.geometry.attributes.color.array[3 * i]
                    );
                    new_color.push(
                      child.geometry.attributes.color.array[3 * i + 1]
                    );
                    new_color.push(
                      child.geometry.attributes.color.array[3 * i + 2]
                    );
                  }
                }
                child.geometry.attributes.position = new THREE.BufferAttribute(
                  new Float32Array(new_pos),
                  3,
                  false
                );
                child.geometry.attributes.color = new THREE.BufferAttribute(
                  new Uint8Array(new_color),
                  3,
                  true
                );
              }
            });
          }
        );
      }
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

      const myStyle = new itowns.Style({
        fill: {
          color: function () {
            return "grey";
          },
          opacity: function (feature) {
            if (
              content.variantIdentifier.includes("GMLID") &&
              feature.getInfo().batchTable.gml_id == gml_id
            ) {
              return 1;
            }
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

  deleteContents(geoVolume) {
    for (let c of geoVolume.content) {
      this.delete3DTilesContent(c);
      this.updateShowButton(c);
    }
  }

  delete3DTilesContent(content) {
    if (this.itownsView.getLayerById(content.id) != undefined) {
      this.itownsView.removeLayer(content.id);
    }
  }

  updateShowButton(content) {
    let showButton = document.getElementById(content.id + "_show_button");
    if (showButton) {
      if (this.itownsView.getLayerById(content.id) != undefined) {
        showButton.children[0].src = "../assets/icons/eye-slash.svg";
        showButton.classList.add("w3-grey");
      } else {
        showButton.classList.remove("w3-grey");
        showButton.children[0].src = "../assets/icons/eye.svg";
      }
    }
  }

  createShowButton(c, isPc = false) {
    let visualisator = document.createElement("button");
    visualisator.className =
      "w3-btn w3-medium w3-bar-item w3-round w3-border w3-right";
    visualisator.id = `${c.id}_show_button`;
    var logo = document.createElement("img");
    logo.width = "20";
    logo.src = "../assets/icons/eye.svg";
    visualisator.appendChild(logo);
    visualisator.onclick = () => {
      if (this.itownsView.getLayerById(c.id) == undefined) {
        if (isPc) this.visualizePointCloudContent(c);
        else this.visualize3DTilesContent(c);
      } else {
        this.delete3DTilesContent(c);
      }
      this.updateShowButton(c);
    };
    return visualisator;
  }

  writeGeoVolume(geovolume, htmlParent) {
    if (geovolume.id && geovolume.links) {
      var li = document.createElement("div");
      li.className = "geovolume-el";
      var linkToSelf = "";
      for (let link of geovolume.links) {
        if (link.rel == "self") {
          linkToSelf = link.href;
        }
      }

      // if (geovolume.parent) {
      //   var button_parent = document.createElement("button");
      //   button_parent.className = "w3-btn w3-round w3-border";
      //   logo = document.createElement("img");
      //   logo.src = "../assets/icons/return.svg";
      //   logo.width = "20";
      //   button_parent.appendChild(logo);
      //   button_parent.onclick = () => {
      //     this.sendEvent(
      //       GeoVolumeWindow.SELECTED_GEOVOLUME_UPDATED,
      //       geovolume.parent
      //     );
      //   };
      //   li.appendChild(button_parent);
      // }

      var div_name = document.createElement("div");
      var a = document.createElement("a");
      a.href = linkToSelf;
      a.target = "_blank";
      a.innerText = geovolume.id;
      div_name.appendChild(a);
      li.appendChild(div_name);

      var bboxButton = document.createElement("button");
      var childrenButton = document.createElement("button");

      bboxButton.className = "w3-btn w3-round w3-grey w3-border";
      logo = document.createElement("img");
      logo.src = "../assets/icons/cube.svg";
      logo.width = "20";
      bboxButton.appendChild(logo);
      bboxButton.onclick = () => {
        if (geovolume.bboxGeom.visible) {
          bboxButton.classList.remove("w3-grey");
        } else {
          bboxButton.classList.add("w3-grey");
        }
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

  get geoVolumeLODId() {
    return `geovolume_lod_div`;
  }

  get geoVolumeLODElement() {
    return findChildByID(this.rootHtml, this.geoVolumeLODId);
  }
  get geoVolumeListId() {
    return `geovolume_list`;
  }

  get geoVolumeListElement() {
    return findChildByID(this.rootHtml, this.geoVolumeListId);
  }

  get lodRangeMinElement() {
    return findChildByID(this.rootHtml, "LOD-range-min");
  }

  get lodRangeMaxElement() {
    return findChildByID(this.rootHtml, "LOD-range-max");
  }

  get lodRangeOutputElement() {
    return findChildByID(this.rootHtml, "output_scale");
  }

  get lodRangeMinOutputElement() {
    return findChildByID(this.rootHtml, "output_scale_min");
  }

  get lodRangeMaxOutputElement() {
    return findChildByID(this.rootHtml, "output_scale_max");
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
