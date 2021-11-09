import { Widgets } from 'ud-viz';

export class GeoVolumeWindow extends Widgets.Components.GUI.Window {
  constructor(geoVolumeSource, itownsView) {
    super('sparqlQueryWindow', 'GeoVolume');
    this.geoVolumeSource = geoVolumeSource;
    this.view = itownsView;
  }

  get innerContentHtml() {
    return /*html*/ `
    
    <input type="button" value="Get Collections" id="${this.getCollectionsButtonId}">
    <input type="button" value="Get Collections by current extent"id="${this.getCollectionsByExtentButtonId}">
    <div class ="box-section" id="${this.geoVolumeDivId}"> 
      <label for="geometry-layers-spoiler" class="section-title">Available GeoVolume</Label>
      <div class="spoiler-box">
        <ul id= "${this.geoVolumeListId}">
        </ul>
      </div>
    </div>
    `;
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
      var innerHTML = '<a href="' + linkToSelf + '">' + geovolume.id + '</a>';
      if (geovolume.content.length > 0) {
        innerHTML += '<br>    Representations : ';
        innerHTML += '<ul> ';
        for (let c of geovolume.content) {
          innerHTML +=
            '<li>' +
            c.title +
            ' : <a href="' +
            c.href +
            '">' +
            c.type +
            '</a></li>';
        }
        innerHTML += '</ul> ';
      }
      li.innerHTML = innerHTML;
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

  displayCollections() {
    if (this.geoVolumeSource.Collections) {
      let list = this.geoVolumeListElement;
      list.innerHTML = '';
      this.writeGeoVolume(this.geoVolumeSource.Collections[0], list);
    }
  }

  windowCreated() {
    this.getCollectionsButtonIdElement.onclick = () => {
      this.geoVolumeSource.getgeoVolumes().then(() => {
        this.displayCollections();
      });
    };

    this.getCollectionsByExtentButtonIdElement.onclick = () => {
      this.geoVolumeSource.getgeoVolumesFromExtent().then(() => {
        this.displayCollections();
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
