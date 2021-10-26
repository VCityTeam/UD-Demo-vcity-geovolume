export class GeoVolume {
  constructor(jsonObject) {
    this.id = jsonObject.id;
    this.title = jsonObject.title;
    this.collectionType = jsonObject.collectionType;
    this.extent = jsonObject.extent;
    this.links = jsonObject.links;
    this.content = jsonObject.content;
    this.children = this.fillChildren(jsonObject.children);
  }

  fillChildren(jsonChildren) {
    let childrenArray = new Array();
    if (jsonChildren) {
      for (let child of jsonChildren) {
        childrenArray.push(new GeoVolume(child));
      }
    }
    return childrenArray;
  }

  containGeovolumeById(id) {
    if (this.id == id) return true;
    for (let child of this.children) {
      return child.containGeovolumeById(id);
    }
    return false;
  }

  getGeovolumeById(id) {
    if (this.id == id) return this;
    for (let child of this.children) {
      return child.getGeovolumeById(id);
    }
    return false;
  }
  
  hasChildById(id) {
    if (this.children) {
      for (let child of this.children) {
        if (child.id == id) return true;
      }
    }
    return false;
  }

  getChildById(id) {
    if (this.children) {
      for (let child of this.children) {
        if (child.id == id) return child;
      }
    }
    return false;
  }
}
