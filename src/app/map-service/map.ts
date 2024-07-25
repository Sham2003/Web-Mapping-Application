import {MapTypes} from './map-types';

function generateId() :string{
	let id:string = '';
	for(let i=0;i<10;i++)
	{
	  id += Math.floor(Math.random()*10).toString();
	}
	return id;
}


export class MapLayer{
	layerid:string = "";
	layername:string = 'Untitled Layer';
	markers:MapTypes.Marker[] = [];
	shapes:MapTypes.Shapes = [];
	selected:boolean = false;
	visible:boolean = true;
	ids:string[] = [];

  
	constructor(id?:string,layername?: string,markers?: MapTypes.Marker[],polygons?: MapTypes.Shapes ){
		this.layerid = id?id:generateId();
		if(layername)
			this.layername = layername;
		if(markers)
			this.markers = markers;
		if(polygons)
			this.shapes = polygons;
		this.addInitialID();
	}

	addInitialID(){
		this.markers.forEach((v) => this.ids.push(v.id as string));
		this.shapes.forEach((s)=> s.id && typeof s.id == 'string'?this.ids.push(s.id):'');
	}

	contains(id:string):boolean{
	  return this.ids.findIndex((val) =>val == id) != -1?true:false;
	}

	setName(name:string){
	  this.layername = name;
	}

	show(){
		this.visible = true;
	}

	hide(){
		this.visible = false;
	}

	select(){
	  this.selected = true;
	}
	unselect(){
	  this.selected = false;
	}
	
	addMarker(m:MapTypes.Marker){
	  this.markers.push(m);
	  this.ids.push(m.id as string);
	}
  
	editMarkerData(m:MapTypes.MapFeatureData){
	  const i = this.markers.findIndex((val,i) => val.id === m.id);
	  if(i != -1){
		this.markers[i].properties['title'] = m.title;
		this.markers[i].properties['description'] = m.description; 
	  }
	}

	addShape(m:MapTypes.Shape){
		this.shapes.push(m);
		this.ids.push(m.id as string);
	}

	editShapeData(m:MapTypes.MapFeatureData){
		const i = this.shapes.findIndex((val,i) => val.id === m.id);
		if( i != -1){
			this.shapes[i].properties['title'] = m.title;
			this.shapes[i].properties['description'] = m.description;
		}
	}
	editMarkerPosition(m:MapTypes.Marker){
		const i = this.markers.findIndex((val,i) => val.id === m.id);
		if(i != -1){
			this.markers[i].geometry = m.geometry;
			this.markers[i].properties['mode'] = m.properties['mode'];
		}
	}

	editShapeGeometry(s:MapTypes.Shape){
		const i = this.shapes.findIndex((val,i) => val.id === s.id);
		if( i != -1){
			var properties = this.shapes[i].properties;
			this.shapes[i].geometry = s.geometry;
			this.shapes[i].properties['mode'] = s.properties['mode'];
			this.shapes[i].properties = {...s.properties,'title':properties['title'],'description':properties['description']};
		}
	}


	_remove(id:string){
		let i = -1;
		i = this.markers.findIndex((val) => val.id === id);
		if(i != -1){
			this.markers.splice(i,1);
			return;
		}
		i = this.shapes.findIndex((val) => val.id === id);
		if(i != -1){
			this.shapes.splice(i,1);
			return;
		}
	}


	toString():MapTypes.MapLayerObject{
	  return {
		id:this.layerid,
		name:this.layername,
		markers:this.markers,
		shapes:this.shapes,
		selected:this.selected,
		visible:this.visible
	  }
	}
	static parseObject(l:MapTypes.MapLayerObject):MapLayer{
		return new MapLayer(l.id,l.name,l.markers,l.shapes);
	}
  
	static createNewLayer(){
	  return new MapLayer();
	}
}

export class MapItem{
    
	mapid!: string;
	mapname!: string;
	description!:string;
	created!: string;
	layers: MapLayer[] = [];
	selectedLayer?:MapLayer;
	static genId = () => generateId();

	static parseObject(m:MapTypes.MapObject):MapItem{
		const newlayers = [];
		for(var l of m.layers){
			newlayers.push(MapLayer.parseObject(l));
		}
		var map = new MapItem(m.id,m.name,m.descr,m.created,newlayers);
		if(m.selected_layer){
			map.setSelectedLayer(m.selected_layer);
		}
		return map;
	}
	constructor(id?: string,name?: string,description?:string,created?: string,layers?: MapLayer[]){
	  if(id){
		this.mapid = id;
	  }else{
		this.mapid = generateId();
	  }
	  if(description){
		this.description = description;
	  }else{
		this.description = 'This is a description';
	  }
	  if(name){
		this.mapname = name;
	  }else{
		this.mapname = "Untitled Map";
	  }
	  if(created){
		this.created = created;
	  }else{
		this.created = new Date().toLocaleDateString()
	  }
	  if(layers && layers.length > 0)
		this.layers = layers;
	  else
		this.layers = [];
	}
	getTitle(){
		return this.mapname;
	}
	getDescription(){
		return this.description;
	}

	setTitle(title?:string)
	{
	  this.mapname = title? title: this.mapname;
	}
  
	setDescription(desc?:string){
	  this.description = desc?desc:this.description;
	}

	editMarkerData(payload: MapTypes.MapFeatureData) {
	  for(var layer of this.layers)
	  {
		if(layer.contains(payload.id)){
		  layer.editMarkerData(payload);
		  break;
		}
	  }
	}

	editShapeData(payload:MapTypes.MapFeatureData){
		for(var layer of this.layers)
		{
			if(layer.contains(payload.id as string)){
				layer.editShapeData(payload);
				break;
			}
		}
	}

	editMarkerPosition(payload:MapTypes.Marker){
		for(var layer of this.layers)
		{
			if(layer.contains(payload.id as string)){
				layer.editMarkerPosition(payload);
				break;
			}
		}
	}

	editShapeGeometry(payload:MapTypes.Shape){
		for(var layer of this.layers)
		{
			if(layer.contains(payload.id as string)){
				layer.editShapeGeometry(payload);
				break;
			}
		}
	}

	getLayer(id:string){
	  return this.layers.find((val)=>val.layerid == id);
	}

	getSelectedLayer(){
	  this.layers.forEach((layer)=> layer.unselect());
	  if(this.selectedLayer){
		this.selectedLayer.select();
		return this.selectedLayer;
	  }
	  else{
		if(this.layers.length == 0){
			this.selectedLayer = this.addNewLayer();
			
		}else{
			this.selectedLayer = this.layers[0];
		}
		this.selectedLayer.select();
		//console.log('Selected Layer => ',this.selectedLayer?.id);
		return this.selectedLayer;
	  }
	}

	setSelectedLayer(id?:string){
	  this.layers.forEach((layer)=> layer.unselect());
	  this.selectedLayer = this.layers.find((val)=>val.layerid === id);
	  this.selectedLayer?.select();
	}

	addNewLayer(){
		const newLayer = MapLayer.createNewLayer();
		this.layers.push(newLayer);
		return newLayer;
	}

	getAllShapes() {
		let shapes:MapTypes.Shapes = [];
	  	for(var layer of this.layers){
			shapes.push(...layer.shapes);
	  	}
	  	return shapes;
	}

	toString():MapTypes.MapObject{
	  const thisstr = {
		id:this.mapid,
		name:this.mapname,
		descr:this.description,
		created:this.created,
		layers:this.layers.map((val)=>val.toString()),
		selected_layer:this.selectedLayer?.layerid
	  }
	  return thisstr;
	}

	getAllPopup(){
	  let popups:MapTypes.Marker[] = [];
	  for(var layer of this.layers){
		popups.push(...layer.markers);
	  }
	  return popups;
	}

	getMapData(){
		const layers =[];
		for(var layer of this.layers){
			const layerData = {
				id:layer.layerid,
				name:layer.layername,
				markers:layer.markers,
				shapes:layer.shapes,
				visible:layer.visible
			}
			layers.push(layerData);
		}
		return layers;
	}

	getLayerData():MapTypes.LayerInfo[]{
		const layers:MapTypes.LayerInfo[] =[];
		for(var layer of this.layers){
			const layerData:MapTypes.LayerInfo = {
				id:layer.layerid,
				name:layer.layername,
				markerinfo:[],
				shapeinfo:[],
				selected:layer.selected,
				visible:layer.visible
			}
			for(var m of layer.markers){
				layerData.markerinfo.push({
					mid:m.id as string,
					mname:m.properties['title'] as string
				});
			}

			for(var s of layer.shapes){
				layerData.shapeinfo.push({
					sid:s.id as string,
					sname:s.properties['title'] as string
				})
			}
			layers.push(layerData);
		}
		return layers;
	}

	
	
	removeFromMap(id:string){
		for(var l of this.layers){
			var ind = l.ids.findIndex((sid) => sid == id);
			if(ind != -1){
				l._remove(id);
				break;
			}
		}
	}

	showLayer(id:string){
		let i = this.layers.findIndex((l) => l.layerid == id);
		if(i!= -1){
			this.layers[i].show();
		}
	}
	hideLayer(id:string){
		let i = this.layers.findIndex((l) => l.layerid == id);
		if(i!= -1){
			this.layers[i].hide();
		}
		
	}
	removeLayer(id:string){
		let i = this.layers.findIndex((l) => l.layerid == id);
		if(i!= -1){
			this.layers.splice(i,1);
			if(this.selectedLayer?.layerid == id){
				this.selectedLayer = undefined;
			}
		}
	}

	isShapeExists(id: string | number | undefined):boolean {
        if(id && typeof id == 'number'){
			console.log("Feature number id");
			return false;
		}
		for(var l of this.layers){
			var ind = l.shapes.findIndex((s) => s.id == id);
			if(ind != -1){
				return true;
			}
		}
		return false;
    }

	isMarkerExists(id: string | number | undefined):boolean {
        if(id && typeof id == 'number'){
			console.log("Feature number id");
			return false;
		}
		for(var l of this.layers){
			var ind = l.markers.findIndex((m) => m.id == id);
			if(ind != -1){
				return true;
			}
		}
		return false;
    }
}

