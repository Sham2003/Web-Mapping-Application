import { Injectable } from '@angular/core';
import { MapItem} from './map';
import { MapTypes } from './map-types';





@Injectable({
  providedIn: 'root'
})
export class MapService {
  maps: MapItem[] = [];
  _v:number = 0;
  constructor() {
    console.log(" Map Service Created once");
    this.loadStorage();
  }

  loadStorage(){
    const items = localStorage.getItem('mymaps');
    if(items){
      const objects:MapTypes.MapObject[] = JSON.parse(items);
      console.log("Loading Storage items");
      for(var m of objects){
        //console.log("Parsing ...");
        //console.log(m);
        const mobj = MapItem.parseObject(m);
        //console.log('Parsed Map Object');
        //console.log(mobj);
        this.maps.push(MapItem.parseObject(m));
      }
      //console.log("Loaded Objects = >",objects.length);
    }
  }

  refresh(){
    this.maps = [];
    this.loadStorage();
  }

  getMaps(){
    return this.maps;
  }

  getMap(id:string):MapItem|undefined{
    const foundMap = this.maps.find((map)=> map.mapid == id); 
    return foundMap;
  }

  createMap(){
    let map:MapItem = new MapItem();
    this.maps.push(map);
    return map.mapid;
  }
  deleteMap(id:string){
    const i = this.maps.findIndex((m) => m.mapid == id);
    if(i != -1){
      this.maps.splice(i,1);
    }
  }

  saveState(){
    var state = [];
    for(var m of this.maps){
      state.push(m.toString());
    }
    //console.log("Saving ",state);
    localStorage.setItem('mymaps',JSON.stringify(state));
  }
}

export { MapItem };

