import { Widgets } from 'ud-viz';

export class GeoVolumeWindow extends Widgets.Components.GUI.Window {
  constructor(geoVolumeSource, allWidget) {
    super('sparqlQueryWindow', 'GeoVolume');
    this.geoVolumeSource = geoVolumeSource;
    this.view = allWidget.view;
    this.app = allWidget;
  }

  get innerContentHtml() {
    return /*html*/ `
    
    <input type="button" value="Get Collections" id="${this.getCollectionsButtonId}">
    <input type="button" value="Get Collections by current extent"id="${this.getCollectionsByExtentButtonId}">
    <div class ="box-section" id="${this.geoVolumeDivId}"> 
      <label for="geometry-layers-spoiler" class="section-title">Available GeoVolume</Label>
      <div class="spoiler-box">
        <ol id= "${this.geoVolumeListId}">
        </ol>
      </div>
    </div>
    `;
  }

  visualizeContent(geovolume,content){
    console.log(content);
    content.url = content.href;
    content.id = geovolume.id + '_' + content.title;
    var itownsLayer = this.app.setup3DTilesLayer(content);
    this.app.add3DTilesLayer(itownsLayer[0]);
    this.app.update3DView();
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
      li.innerHTML = '<a href="' + linkToSelf + '">' + geovolume.id + '</a>';
      
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
            visualisator.id = `${geovolume.id}_${c.title}`;
            visualisator.innerHTML = ' <img src="/assets/icons/more.svg" width="20px" height="20px"></img>';
            visualisator.onclick = () => {this.visualizeContent(geovolume,c);};
            representationEl.append(visualisator);
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
      console.log(this.geoVolumeSource.Collections);
      let list = this.geoVolumeListElement;
      list.innerHTML = '';
      this.writeGeoVolume(this.geoVolumeSource.Collections[0], list);
    }
  }

  displayCollectionsInScene(geoVolume){
    geoVolume.displayBbox(this.view.scene);
    if (geoVolume.children.length > 0) {
      for (let child of geoVolume.children) {
        this.displayCollectionsInScene(child);
        this.app.update3DView();
      }
    }
  }


  windowCreated() {
    this.getCollectionsButtonIdElement.onclick = () => {
      this.geoVolumeSource.getgeoVolumes().then(() => {
        this.displayCollectionsInHTML();
        this.displayCollectionsInScene(this.geoVolumeSource.Collections[0]);
      });
    };

    this.getCollectionsByExtentButtonIdElement.onclick = () => {
      this.geoVolumeSource.getgeoVolumesFromExtent().then(() => {
        this.displayCollectionsInHTML();
        console.log(this.geoVolumeSource.Collections);
        this.displayCollectionsInScene(this.geoVolumeSource.Collections[0]);
      });
    };
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
