import { boxIntersect } from "box-intersect";
import * as THREE from "three";
import * as proj4 from "proj4";
export class GeoVolume {
  constructor(jsonObject, crs = "EPSG:4326", parent = null) {
    this.id = jsonObject.id;
    this.title = jsonObject.title;
    this.collectionType = jsonObject.collectionType;
    this.extent = jsonObject.extent;
    this.crs = crs;
    this.centroid = this.getCentroid(this.crs);
    this.links = jsonObject.links;
    this.content = jsonObject.content;
    this.children = this.fillChildren(jsonObject.children);
    this.bboxGeom = null;
    this.parent = parent;
    this.createBbox();
  }

  isExtentInstersectingWithBbox(bbox, crs) {
    let bboxReprojected = this.reprojectBbox(bbox, crs);
    let extentBbox = this.extent.spatial.bbox;
    return boxIntersect([bboxReprojected, extentBbox]).length > 0;
  }

  getCentroid(crs = null) {
    let bbox = this.extent.spatial.bbox;
    if (crs) {
      bbox = this.reprojectBbox(bbox, crs);
    }
    return [
      (bbox[0] + bbox[3]) / 2,
      (bbox[1] + bbox[4]) / 2,
      (bbox[2] + bbox[5]) / 2,
    ];
  }

  deleteBbox(threeScene) {
    threeScene.remove(this.bboxGeom);
    for (let child of this.children) {
      child.deleteBbox(threeScene);
    }
  }

  createBbox() {
    let bbox = this.extent.spatial.bbox;
    bbox = this.reprojectBbox(bbox, this.crs);
    var geom = new THREE.BoxGeometry(
      bbox[3] - bbox[0],
      bbox[1] - bbox[4],
      bbox[2] - bbox[5],
      1,
      1,
      1
    );
    var cube = new THREE.Mesh(geom);
    cube.material = new THREE.MeshPhongMaterial();
    cube.material.transparent = true;
    cube.material.opacity = 0.5;
    cube.position.set(this.centroid[0], this.centroid[1], this.centroid[2]);
    cube.updateMatrixWorld();

    var geo = new THREE.EdgesGeometry(cube.geometry); // or WireframeGeometry
    var mat = new THREE.LineBasicMaterial({ color: 0x000000 });
    var wireframe = new THREE.LineSegments(geo, mat);
    cube.add(wireframe);
    wireframe.updateWorldMatrix(false, false);

    cube.geoVolume = this;
    this.bboxGeom = cube;
    this.bboxGeom.visible = false;
  }

  hideBbox() {
    this.bboxGeom.visible = false;
  }

  showBbox() {
    this.bboxGeom.visible = true;
  }

  displayBbox(threeScene) {
    this.createBbox();
    threeScene.add(this.bboxGeom);
    this.bboxGeom.visible = true;
  }

  changeBboxVisibility() {
    this.bboxGeom.visible = !this.bboxGeom.visible;
  }

  getBboxGeom() {
    let geoVolumesBbox = new Array();
    geoVolumesBbox.push(this.bboxGeom);
    for (let child of this.children) {
      geoVolumesBbox = geoVolumesBbox.concat(child.getBboxGeom());
    }
    return geoVolumesBbox;
  }

  getVisibleBboxGeom() {
    let geoVolumesBbox = new Array();
    if (this.bboxGeom.visible) geoVolumesBbox.push(this.bboxGeom);
    for (let child of this.children) {
      geoVolumesBbox = geoVolumesBbox.concat(child.getVisibleBboxGeom());
    }
    return geoVolumesBbox;
  }
  reprojectBbox(bbox, crs) {
    let destCrs = crs ? crs : "EPSG:4326";
    let sourceCrs = this.extent.spatial.crs
      ? this.extent.spatial.crs
      : "EPSG:4326";
    let minBbox, maxBbox;
    if (bbox.length == 6) {
      minBbox = proj4
        .default(sourceCrs, destCrs)
        .forward([bbox[0], bbox[1], bbox[2]]);
      maxBbox = proj4
        .default(sourceCrs, destCrs)
        .forward([bbox[3], bbox[4], bbox[5]]);
    } else {
      minBbox = proj4.default(sourceCrs, destCrs).forward([bbox[0], bbox[1]]);
      maxBbox = proj4.default(sourceCrs, destCrs).forward([bbox[2], bbox[3]]);
    }
    return minBbox.concat(maxBbox);
  }

  isBboxContainedInExtent(bbox, crs) {
    let bboxReprojected = this.reprojectBbox(bbox, crs);
    let extentBbox = this.extent.spatial.bbox;
    return (
      extentBbox[0] <= bboxReprojected[0] &&
      extentBbox[1] <= bboxReprojected[1] &&
      extentBbox[3] >= bboxReprojected[3] &&
      extentBbox[4] >= bboxReprojected[4]
    );
  }

  fillChildren(jsonChildren) {
    let childrenArray = new Array();
    if (jsonChildren) {
      for (let child of jsonChildren) {
        childrenArray.push(new GeoVolume(child, this.crs, this));
      }
    }
    return childrenArray;
  }

  getContent(type = null) {
    if (type) {
      let content = new Array();
      for (let c of this.content) {
        if (c.type.includes(type)) content.push(c);
      }
      return content;
    } else return this.content;
  }

  containGeovolumeById(id) {
    if (this.id == id) return this;
    let geoVolume = null;
    for (let child of this.children) {
      geoVolume = child.containGeovolumeById(id);
    }
    return geoVolume;
  }

  getGeovolumeById(id) {
    if (this.id == id) return this;
    let geoVolume = null;
    for (let child of this.children) {
      geoVolume = child.getGeovolumeById(id);
    }
    return geoVolume;
  }

  getContentByTitle(title) {
    for (let c of this.content) {
      if (c.title == title) return c;
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
