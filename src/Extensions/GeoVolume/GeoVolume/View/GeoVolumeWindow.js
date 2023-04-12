import { itowns, THREE, setup3DTilesLayer, THREEUtil,CityObjectID, TilesManager, findChildByID } from '@ud-viz/browser';
import { EventSender } from '@ud-viz/shared';


import { refinementFiltered } from '../../Utils/Refinement';
// import { SensorExtension } from '../../../Sensor/SensorExtension';
export class GeoVolumeWindow extends EventSender {
  constructor(geoVolumeSource, allWidget) {
    super();
    /** @type {HTMLElement} */
    this.rootHtml = document.createElement('div');
    this.rootHtml.innerHTML = this.innerContentHtml;
    
    this.geoVolumeSource = geoVolumeSource;
    this.itownsView = allWidget.frame3DPlanar.getItownsView();
    this.app = allWidget;

    this.mouseClickListener = (event) => {
      this.onMouseClick(event);
    };

    this.registerEvent(GeoVolumeWindow.GEOVOLUME_COLLECTION_UPDATED);

    this.geoVolumeSource.getgeoVolumes().then(() => {
      this.deleteBboxGeomOfGeovolumes();
      this.displayCollectionsInHTML();
      this.displayCollectionsInScene();
      this.itownsView.notifyChange();
      this.sendEvent(GeoVolumeWindow.GEOVOLUME_COLLECTION_UPDATED);
    }); 
  }

  onMouseClick(event) {
    event.preventDefault();
    let raycaster = new THREE.Raycaster();
    let mouse3D = new THREE.Vector2(
      (event.layerX / this.app.frame3DPlanar.getRootWebGL().offsetWidth) * 2.0 - 1,
      -(event.layerY / this.app.frame3DPlanar.getRootWebGL().offsetHeight) * 2 + 1
    );
    raycaster.setFromCamera(mouse3D, this.itownsView.camera.camera3D);
    let intersects = raycaster.intersectObjects(this.geoVolumeSource.getVisibleGeoVolumesBboxGeom());
    if(intersects.length > 0){
      this.displayGeoVolumeInHTML(intersects[0].object.geoVolume);
      for(let visibleBbox of this.geoVolumeSource.getVisibleGeoVolumesBboxGeom()){
        visibleBbox.geoVolume.hideBbox(this.itownsView.scene);
      }
      intersects[0].object.geoVolume.displayBbox(this.itownsView.scene);
      this.itownsView.notifyChange();
    }
  }

  addListenerTo(div) {
    this.removeListener();
    div.addEventListener('mousedown', this.mouseClickListener);
    this.htmlListened = div;
  }

  removeListener() {
    if (this.htmlListened)
      this.htmlListened.removeEventListener(
        'mousedown',
        this.mouseClickListener
      );
  }

  html() {
    return this.rootHtml;
  }

  dispose() {
    this.rootHtml.remove();
    this.removeListener();
  }

  get innerContentHtml() {
    return /*html*/ `
    <div class="box-section">
      <div class ="box-section" id="${this.geoVolumeDivId}"> 
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
    if(content.variantIdentifier == 'extent')
      refinementFiltered(l3dt);

    
    var visualisator = document.getElementById(content.id);
    visualisator.innerHTML =
      'Hide';
    visualisator.onclick = () => {
      this.deletePointCloudContent(geovolume, content);
    };
  }

  visualize3DTilesContent(geovolume, content) {
    if (content.url == undefined) content.url = content.href;
    content.color = "0xffffff";
    if (this.itownsView.getLayerById(content.id) == undefined) {
      var itownsLayer = setup3DTilesLayer(
        content,
        this.app.frame3DPlanar.getLayerManager(),
        this.itownsView
      );
      itowns.View.prototype.addLayer.call(this.itownsView, itownsLayer);
      var tilesManager = this.app.frame3DPlanar.getLayerManager().getTilesManagerByLayerID(
        content.id
      );
      tilesManager.addEventListener(TilesManager.EVENT_TILE_LOADED,function(tile){THREEUtil.appendWireframeByGeometryAttributeToObject3D(tile,"_BATCHID");});
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
            content.variantIdentifier.includes('GMLID') ||
            content.variantIdentifier.includes('GUID')
          ) {
            tilesManager.setStyleToTileset('hide');
            var id = content.variantIdentifier.split('=')[1];
            for (let tile of tilesManager.tiles) {
              if (tile != undefined) {
                if (tile.cityObjects != undefined) {
                  let lineGeometry = tile.getObject3D().children[0].children[0].children[0];                    
                  let transparentMat = new THREE.LineBasicMaterial({color: 0x000000});
                  let mat = new THREE.LineBasicMaterial({color: 0x000000});
                  transparentMat.transparent = true;
                  transparentMat.opacity = 0;
                  let mats = [transparentMat,mat];
                  lineGeometry.material = mats;
                  lineGeometry.geometry.material = mats;

                  for (let cityObject of tile.cityObjects) {
                    for (let prop of Object.entries(cityObject.props)) {
                      if (prop[1] == id) {
                        tilesManager.styleManager.setStyle(cityObject.cityObjectId, 'default');
                        let lineGeometry = tile.getObject3D().children[0].children[0].children[0];                    
                        const firstIndex = lineGeometry.geometry.attributes._BATCHID.array.indexOf(cityObject.batchId);
                        const indexCount = lineGeometry.geometry.attributes._BATCHID.array.reduce((acc, cur) => cur === cityObject.batchId ? acc + 1 : acc, 0);   
                        lineGeometry.geometry.addGroup(firstIndex,indexCount,1);
                      }
                    }
                  }
                  tilesManager.applyStyleToTile(tile.tileId);
                }
              }
            }
          } else if (
            content.variantIdentifier.includes('TileID') &&
            content.variantIdentifier.includes('Batch_ID')
          ) {
            tilesManager.addEventListener(
              TilesManager.EVENT_TILE_LOADED,
              function () {
                var keys = content.variantIdentifier.split('&');
                var tileId = keys[0].split('=')[1];
                var batchId = keys[1].split('=')[1];
                var coID = new CityObjectID(tileId, batchId);

                tilesManager.setStyleToTileset('hide');
                tilesManager.styleManager.setStyle(coID, 'default');

                tilesManager.applyStyles();
                tilesManager.view.notifyChange();
              }
            );
          } else if (!content.variantIdentifier.includes('file')) {
            console.log(
              'variant accessor not handled : ' + content.variantIdentifier
            );
          }
        }
      );

      var visualisator = document.getElementById(content.id);
      visualisator.innerHTML =
        'Hide';
      visualisator.onclick = () => {
        this.delete3DTilesContent(geovolume, content);
      };
    }
  }

  hideOutliers(tile){
    let lineGeometry = tile.getObject3D().children[0].children[0].children[0];                    
    let transparentMat = new THREE.LineBasicMaterial({color: 0x000000});
    transparentMat.transparent = true;
    transparentMat.opacity = 0;
    let mats = [lineGeometry.material,transparentMat];
    lineGeometry.material = transparentMat;
    lineGeometry.geometry.material = transparentMat;
  }
  delete3DTilesContent(geovolume, content) {
    if (this.itownsView.getLayerById(content.id) != undefined) {
      this.app.frame3DPlanar.getLayerManager().remove3DTilesLayerByLayerID(content.id);
      var visualisator = document.getElementById(content.id);
      visualisator.innerHTML =
        'Show in 3DScene';
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
        'Show in 3DScene';
      visualisator.onclick = () => {
        this.visualizePointCloudContent(geovolume, content);
      };
    }
  }

  writeGeoVolume(geovolume, htmlParent) {
    if (geovolume.id && geovolume.links) {
      var li = document.createElement('div');
      var linkToSelf = '';
      for (let link of geovolume.links) {
        if (link.rel == 'self') {
          linkToSelf = link.href;
        }
      }
      var a = document.createElement('a');
      a.href = linkToSelf;
      a.innerText = geovolume.id;
      li.appendChild(a);

      if (geovolume.content.length > 0) {
        li.innerHTML += '<br>    Representations : ';

        var representationsList = document.createElement('ul');
        for (let c of geovolume.content) {
          var representationEl = document.createElement('li');
          representationEl.innerHTML = c.title + ' ';
          if (c.type.includes('3dtiles')) {
            let visualisator = document.createElement('button');
            visualisator.id = `${geovolume.id + '_' + c.title}`;
            c.id = geovolume.id + '_' + c.title;
            if (this.itownsView.getLayerById(c.id) == undefined) {
              visualisator.innerHTML =
                'Show in 3DScene';
              visualisator.onclick = () => {
                this.visualize3DTilesContent(geovolume, c);
              };
            } else {
              visualisator.innerHTML =
                'hide';
              visualisator.onclick = () => {
                this.delete3DTilesContent(geovolume, c);
              };
            }
            representationEl.append(visualisator);
          } else if (c.type.includes('sensor')) {
            var sensorDiv = document.createElement('a');
            sensorDiv.id = 'geoVolume_sensor';
            representationEl.append(sensorDiv);
          } else if (c.type.includes('sparql')) {
            var sparqlDiv = document.createElement('a');
            sparqlDiv.className = 'geoVolume_sparql';
            sparqlDiv.setAttribute('geoVolumeId', geovolume.id);
            sparqlDiv.setAttribute('variantId', c.title);
            representationEl.append(sparqlDiv);
          }
          else if (c.type.includes('pnts'))
          {
            let visualisator = document.createElement('button');
            visualisator.id = `${geovolume.id + '_' + c.title}`;
            c.id = geovolume.id + '_' + c.title;
            if (this.itownsView.getLayerById(c.id) == undefined) {
              visualisator.innerHTML =
                'Show in 3DScene';
              visualisator.onclick = () => {
                this.visualizePointCloudContent(geovolume, c);
              };
            } else {
              visualisator.innerHTML =
                'Hide';
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

      var childrenButton = document.createElement('button');
      childrenButton.innerHTML = 'Show Children';
      childrenButton.onclick = () => {
        geovolume.hideBbox(this.itownsView.scene);
        for(let children of geovolume.children){
          children.displayBbox(this.itownsView.scene);
        }
        this.itownsView.notifyChange();
      };
      li.appendChild(childrenButton);
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
      list.innerHTML = '';
      for (let geoVolume of this.geoVolumeSource.Collections)
        this.writeGeoVolume(geoVolume, list);
    }
  }

  displayGeoVolumeInHTML(geoVolume){
    let list = this.geoVolumeListElement;
    list.innerHTML = '';
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
      'mousedown',
      this.clickListener
    );
    this.deleteBboxGeomOfGeovolumes();
    this.itownsView.notifyChange();
  }

  get getCollectionsButtonId() {
    return `${this.windowId}_get_collections_button`;
  }

  get getCollectionsButtonIdElement() {
    return findChildByID(this.rootHtml,this.getCollectionsButtonId);
  }

  get getCollectionsByExtentButtonId() {
    return `${this.windowId}_get_collections_by_extent_button`;
  }

  get getCollectionsByExtentButtonIdElement() {
    return findChildByID(this.rootHtml,this.getCollectionsByExtentButtonId);
  }

  get geoVolumeDivId() {
    return `${this.windowId}_geovolume_div`;
  }

  get geoVolumeListId() {
    return `${this.windowId}_geovolume_list`;
  }

  get geoVolumeListElement() {
    return findChildByID(this.rootHtml,this.geoVolumeListId);
  }

  static get GEOVOLUME_COLLECTION_UPDATED() {
    return 'GEOVOLUME_COLLECTION_UPDATED';
  }
}
