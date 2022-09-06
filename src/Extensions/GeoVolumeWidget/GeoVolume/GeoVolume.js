import { boxIntersect } from "box-intersect";
import proj4 from 'proj4';
import { THREE} from "ud-viz";

export class GeoVolume {
  constructor(jsonObject) {
    this.id = jsonObject.id;
    this.title = jsonObject.title;
    this.collectionType = jsonObject.collectionType;
    this.extent = jsonObject.extent;
    this.centroid = this.getCentroid('EPSG:3946');
    this.links = jsonObject.links;
    this.content = jsonObject.content;
    this.children = this.fillChildren(jsonObject.children);
    this.bboxGeom = null;
  }

  isExtentInstersectingWithBbox(bbox, crs) {
    let bboxReprojected = this.reprojectBbox(bbox, crs);
    let extentBbox = this.extent.spatial.bbox;
    return boxIntersect([bboxReprojected, extentBbox]).length > 0;
  }

  getCentroid(crs=null) {
    let bbox = this.extent.spatial.bbox;
    if(crs){
      bbox = this.reprojectBbox(bbox,crs);
    } 
    return [
      (bbox[0] + bbox[3]) / 2,
      (bbox[1] + bbox[4]) / 2,
      (bbox[2] + bbox[5]) / 2,
    ];
  }

  displayBbox(threeScene) {
    let bbox = this.extent.spatial.bbox;
    bbox = this.reprojectBbox(bbox,"EPSG:3946");
    var geom = new THREE.BoxGeometry(
      bbox[3] - bbox[0],
      bbox[1] - bbox[4],
      bbox[2] - bbox[5]
    );
    var cube = new THREE.Mesh(geom);
    console.log(cube);
    cube.material.wireframe = true;
    cube.material.wireframeLinewidth = 20;
    // cube.material.transparent = true;
    // cube.material.opacity = 0.5;

    cube.material.color.setHex(Math.random() * 0xffffff);
    cube.position.set(this.centroid[0], this.centroid[1], this.centroid[2]);

    cube.updateMatrixWorld();
    cube.geoVolume = this;
    threeScene.add(cube);
    this.bboxGeom = cube;
  }

  reprojectBbox(bbox, crs) {
    let destCrs = crs ? crs : "EPSG:4326";
    let sourceCrs = this.extent.spatial.crs
      ? this.extent.spatial.crs
      : "EPSG:4326";
    let minBbox, maxBbox;
    if (bbox.length == 6) {
      minBbox = proj4(sourceCrs, destCrs).forward([bbox[0], bbox[1], bbox[2]]);
      maxBbox = proj4(sourceCrs, destCrs).forward([bbox[3], bbox[4], bbox[5]]);
    } else {
      minBbox = proj4(sourceCrs, destCrs).forward([bbox[0], bbox[1]]);
      maxBbox = proj4(sourceCrs, destCrs).forward([bbox[2], bbox[3]]);
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
        childrenArray.push(new GeoVolume(child));
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
      console.log(content);
      return content;
    } else return this.content;
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
