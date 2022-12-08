import { Widgets,Components,itowns,THREE } from 'ud-viz';
import { SensorExtension } from '../Sensor/SensorExtension';
export class GeoVolumeWindow extends Widgets.Components.GUI.Window {
  constructor(geoVolumeSource, allWidget) {
    super('geovolumeWindow', 'GeoVolume',false);
    this.geoVolumeSource = geoVolumeSource;
    this.view = allWidget.view3D.getItownsView();
    this.app = allWidget;
    this.bboxGeomOfGeovolumes = new Array();
  }

  onMouseClick(event){
    event.preventDefault(); 
    let raycaster =  new THREE.Raycaster();
    let mouse3D = new THREE.Vector2( (event.layerX / this.app.view3D.rootWebGL.offsetWidth * 2.0) - 1,   
      -( event.layerY / this.app.view3D.rootWebGL.offsetHeight) * 2 + 1);     
      
    raycaster.setFromCamera( mouse3D, this.view.camera.camera3D );
    let intersects = raycaster.intersectObjects( this.bboxGeomOfGeovolumes);
    console.log(intersects);
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
    `;
  }

  visualizeContent(geovolume,content){
    if(content.url == undefined)
      content.url = content.href;
    if(this.app.view3D.itownsView.getLayerById(content.id) == undefined){
      var itownsLayer = Components.setup3DTilesLayer(content,this.app.view3D.layerManager,this.view);
      itowns.View.prototype.addLayer.call(this.view,itownsLayer);
      var visualisator = document.getElementById(content.id);
      visualisator.innerHTML = ' <img src="/assets/icons/delete.svg" width="20px" height="20px"></img>';
      visualisator.onclick = () => {this.deleteContent(geovolume,content);};
    }
  }

  deleteContent(geovolume,content){
    if(this.app.view3D.itownsView.getLayerById(content.id) != undefined){
      this.app.view3D.layerManager.removeLayerByLayerID(content.id);
      var visualisator = document.getElementById(content.id);
      visualisator.innerHTML = ' <img src="/assets/icons/more.svg" width="20px" height="20px"></img>';
      visualisator.onclick = () => {this.visualizeContent(geovolume,content);};
    }
  }

  writeGeoVolume(geovolume, htmlParent) {
    if (geovolume.id && geovolume.links) {
      var li = document.createElement('li');
      li.className = 'ordered';
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
          representationEl.innerHTML = c.title +
            ' : <a href="' +
            c.href +
            '"></a>' +
            c.type;
          if(c.type.includes('3dtiles')){
            var visualisator = document.createElement('a');
            visualisator.id = `${geovolume.id + '_' + c.title}`;
            c.id = geovolume.id + '_' + c.title;
            if(this.app.view3D.itownsView.getLayerById(c.id) == undefined){
              visualisator.innerHTML = ' <img src="/assets/icons/more.svg" width="20px" height="20px"></img>';
              visualisator.onclick = () => {this.visualizeContent(geovolume,c);};
            }
            else{
              visualisator.innerHTML = ' <img src="/assets/icons/delete.svg" width="20px" height="20px"></img>';
              visualisator.onclick = () => {this.deleteContent(geovolume,c);};
            }
            representationEl.append(visualisator);
          }
          if(c.type.includes('sensor')){
            new SensorExtension(this,representationEl);
          }
          representationsList.appendChild(representationEl);   
        }
        li.appendChild(representationsList);
      }
      if (geovolume.children.length > 0) {
        var ol = document.createElement('ol');
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
      list.innerHTML = '';
      for(let geoVolume of this.geoVolumeSource.Collections)
        this.writeGeoVolume(geoVolume, list);
    }
  }

  displayGeoVolumeInScene(geoVolume){
    geoVolume.displayBbox(this.view.scene);
    this.bboxGeomOfGeovolumes.push(geoVolume.bboxGeom);
    if (geoVolume.children.length > 0) {
      for (let child of geoVolume.children) {
        this.displayCollectionsInScene(child);
      }
    }
    this.app.update3DView();
  }

  displayCollectionsInScene(){
    for(let geoVolume of this.geoVolumeSource.Collections)
      this.displayGeoVolumeInScene(geoVolume);
  }

  windowCreated() {
    // this.clickListener = (event) => {
    //   this.onMouseClick(event);
    // };
    // this.app.viewerDivElement.addEventListener('mousedown', this.clickListener);
    // this.getCollectionsButtonIdElement.onclick = () => {
    this.geoVolumeSource.getgeoVolumes().then(() => {
      this.deleteBboxGeomOfGeovolumes();
      this.displayCollectionsInHTML();
      this.displayCollectionsInScene();
    });
    // };

  //   this.getCollectionsByExtentButtonIdElement.onclick = () => {
  //     this.geoVolumeSource.getgeoVolumesFromExtent().then(() => {
  //       this.deleteBboxGeomOfGeovolumes();
  //       this.displayCollectionsInHTML();
  //       this.displayCollectionsInScene();
  //     });
  //   };
  }

  deleteBboxGeomOfGeovolumes(){
    for(let bbox of this.bboxGeomOfGeovolumes){
      this.view.scene.remove(bbox);
    }
  }

  windowDestroyed() {
    this.app.viewerDivElement.removeEventListener('mousedown',this.clickListener);
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
}
