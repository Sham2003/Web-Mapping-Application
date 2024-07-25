import * as L from "leaflet";
import { editablePopup, EditablePopupDataEvent, marker, watermark, WatermarkControl } from "./infopopup";
import { MapControlUI, mapui } from "./ui-control.component";
import { MapItem} from "../map-service/map";
import {Feature,GeometryObject} from 'geojson';
import { MapTypes } from "../map-service/map-types";
import { Router } from "@angular/router";
import { Subject, Observable } from "rxjs";
import { DrawMapUI } from "./map-drawer";

interface MyMapOptions extends L.MapOptions{
}
const defaultStyle:L.PathOptions =  {
    stroke:true,
    color:'orange',
    opacity:1,
    dashArray:[3,3,3],
    dashOffset:'2',
    fill:true,
    fillColor:'#800026'
}
const hoverStyle:L.PathOptions = {
    stroke:true,
    color:'white',
    opacity:1,
    weight:3,
    fill:true,
    fillColor:'grey'
}

const defaultlineStyle:L.PathOptions = {
    stroke:true,
    color:'orange',
    opacity:1,
    dashArray:[3,3,3],
    fill:false
}
const hoverlineStyle:L.PathOptions = {
    stroke:true,
    weight:2,
    color:'white',
    opacity:1,
    dashOffset:'2',
    fill:false
}


const defaultTileLayer:{url:string,options:L.TileLayerOptions} = {
    url:'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
        maxZoom: 19,
        minZoom:1,
        attribution: '© OpenStreetMap',
        noWrap:true,
        //id:'mapbox/streets-v12'
    }
}
const myTileLayer:{url:string,options:L.TileLayerOptions} = {
    url:'http://localhost:3650/api/maps/satellite-hybrid/256/{z}/{x}/{y}.jpg',
    options:{
        maxZoom: 22,
        minZoom: 1,
        attribution:'© MapTiler - OpenStreetMap',
        noWrap:true
    }
}


type UpdatePayload = string;
type MyMapLayer = {id:string,name:string,layer:L.LayerGroup,visible:boolean,added?:boolean}

export class MyMap{
    private updateSubject: Subject<UpdatePayload> = new Subject<UpdatePayload>();
	
    private map:L.Map;
    private drawcontrol!:DrawMapUI
    private baselayer:L.TileLayer;
    private mapcontext!:MapItem;
    private mapui!:MapControlUI;
    private mylayers:MyMapLayer[] = [];
    private router!:Router;
    private _element:string | HTMLElement;
    private _zoomcontrol!:L.Control;
    selectedlayerid:string|undefined;
    currentDrawMode:string = '';
    options: MyMapOptions;
    private __watermark!:WatermarkControl;

    constructor(element: string | HTMLElement,router?:Router,mapobj?:MapItem,options?: MyMapOptions){
        this.options = options?options:{};
        this._element = element;
        if(mapobj)
            this.mapcontext = mapobj;

        if(router)
            this.router = router;
        
        this.baselayer = L.tileLayer(defaultTileLayer.url, defaultTileLayer.options);
        
        //this.baselayer = L.tileLayer(myTileLayer.url, myTileLayer.options);
        
        this.map = L.map(this._element,{
			center:[14.5024,77.2031],
			zoom:2,
            layers:[this.baselayer],
			zoomControl:false,
            //worldCopyJump:true
		});
        this.initMyMap();

    }

    private initMyMap(){
        this.initControls();
        this.initDrawControl();
        this.initMapObjects();
        this.initMapHandler();
	}

    private initControls(){
        this._zoomcontrol = L.control.zoom({position:'bottomright'});
        this._zoomcontrol.addTo(this.map);

		this.__watermark = watermark({ position: 'topright'});
        
        if(this.router){
            this.__watermark.addClickListener((event)=>{
                this.router.navigate(['/']);
            })
        }
		this.__watermark.addTo(this.map);
        if(!this.mapcontext){
            return;
        }
        this.initMapUI();

    }

    private initMapUI(){
        this.mapui = mapui(this.mapcontext,{position:'topleft'})
        this.mapui.addTo(this.map);
    }

    
    public getChangeObservable$():Observable<UpdatePayload> {
		return this.updateSubject.asObservable();
	}

    private saveChanges(request?:string){
        this.updateSubject.next(request || '');
    }

    public setMapContext(mapobj:MapItem){
        this.mapcontext = mapobj;
        this.updateMap();
    }

    private clearAll(){
        if(this.mylayers.length >= 1){
            this.mylayers.forEach((layer)=>this.map.removeLayer(layer.layer));
        }
        if(this.mapui){
            this.map.removeControl(this.mapui);
        }
        if(this._zoomcontrol){
            this.map.removeControl(this._zoomcontrol);
        }
        if(this.__watermark){
            this.map.removeControl(this.__watermark);
        }
        this.drawcontrol.removeControl();
    }

    

    initDrawControl() {
        this.drawcontrol = new DrawMapUI(this.map);
    }

    private updateMap(){
        this.clearAll();
        this.initControls();
        this.drawcontrol.addControl();
        this.initMapObjects();
    }

    private updateui(){
        if(this.mapui)
            this.mapui.update();
    }

    private initMapObjects(){
		if(!this.mapcontext)
			return;


        this.refreshLayers();
    }

    private clearLayers(){
        var list = this.mylayers;
        for(var l of list){
            if(this.map.hasLayer(l.layer))
                this.map.removeLayer(l.layer);
        }

        while(this.mylayers.length != 0 ){
            this.mylayers.pop();
        }

    }

    private refreshLayers(){
        this.clearLayers();
        const selectedMode = this.currentDrawMode;
        var map = this.map;
        for(const ld of this.mapcontext.getMapData()){
            const newLayer = L.geoJSON(ld.markers,{
                pointToLayer(g, latlng) {
                    const newMarker = marker(latlng);
                    return newMarker;
                },
                onEachFeature(feature, layer) {
                    if(selectedMode == ''){
                        console.log("Layer for feature = ",feature.geometry.type);
                        layer.bindPopup(editablePopup(feature))
                        if(feature.geometry.type != 'Point'){
                            layer.on({
                                mouseover: (event) => {
                                    var _layer = event.target;
                                    _layer.setStyle(feature.geometry.type == 'LineString'?hoverlineStyle:hoverStyle);
                                } ,
                                mouseout:(event) => {
                                    var _layer = event.target;
                                    _layer.setStyle(feature.geometry.type == 'LineString'?defaultlineStyle:defaultStyle);
                                },
                                click:(event)=>{
                                    map.fitBounds(event.target.getBounds());
                                }
                            })
                        }else{
                            layer.on({
                                mouseover: (event) => {
                                    var _layer = event.target;
                                    //_layer.openPopup();
                                } ,
                                mouseout:(event) => {
                                    var _layer = event.target;
                                    //_layer.closePopup();
                                },
                                click:(event)=>{
                                    ;
                                }
                            })
                        }
                        
                    }      
                },
                style(feature?: Feature<GeometryObject, any>) : L.PathOptions{
                    if(!feature){
                        return defaultStyle;
                    }
                    if(feature.geometry.type == 'LineString'){
                        return defaultlineStyle;
                    }else {
                        return defaultStyle;
                    }
                }
            });


            for(var s of ld.shapes){
                newLayer.addData(s);
            }
            var LayerObject:MyMapLayer = {
                id:ld.id,
                name:ld.name,
                layer:newLayer,
                visible:ld.visible,
                added:false,
            }

            if(ld.visible){
                newLayer.addTo(this.map);
                LayerObject.added = true;
            }
            this.mylayers.push(LayerObject);
        }

	}

    clearMouseCursor(){
        if(this._element && typeof this._element == 'string'){
            const element = document.getElementById(this._element)
            if(element)
                element.style.cursor = 'auto';
        }
        
    }

    private refreshMap(){
        if(this.currentDrawMode == 'select')
            return;
        this.refreshLayers();
        console.log('Refresh Map - = == Layer Objects count => ',this.mylayers.length);
        console.log(this.mylayers);
    }


    private initMapHandler(){
        this.map.on('get-editable-data',(ev)=>{
            this.drawcontrol.setEditableData(this.mapcontext.getMapData())
        })

        this.map.on('delete-marker',(event:any)=>{
            if(this.currentDrawMode == ''){
                this.mapcontext.removeFromMap(event.mid);
                this.refreshMap();
            }
            this.saveChanges('delete-marker');
        })

        this.map.on('delete-shape',(event:any)=>{
            if(this.currentDrawMode == ''){
                this.mapcontext.removeFromMap(event.sid);
                this.refreshMap();
            }
            this.refreshMap();
            this.saveChanges('delete-shape');
        })

        this.map.on('show-layer',(event:any)=>{
            this.mapcontext.showLayer(event.layerid);
            this.refreshMap();
            this.saveChanges('show-layer');
        })

        this.map.on('hide-layer',(event:any)=>{
            this.mapcontext.hideLayer(event.layerid);
            this.refreshMap();
            this.saveChanges('show-layer');
        })

        this.map.on('refresh-layer',(event:any)=>{
            this.refreshLayers();
            console.log('Layer Objects count => ',this.mylayers.length);
            console.log(this.mylayers);
        });

        this.map.on('clear-layers',(event:any)=>{
            this.clearLayers();
            console.log(this.mylayers);
        });

        this.map.on('create-layer',(event)=>{
            this.mapcontext.addNewLayer();
            this.saveChanges('new-layer');
        })

        this.map.on('delete-layer',(event:any)=>{
            this.mapcontext.removeLayer(event.layerid);
            this.refreshMap();
            this.saveChanges('delete-layer')
        })
        

        this.map.on('set-layer',(event:any)=>{
            this.mapcontext.setSelectedLayer(event.layerid);
            this.mapcontext.showLayer(event.layerid);
            this.saveChanges('select-layer');
        })

        // popup info change listeners
		// @ts-ignore
		this.map.on('popup-data-change',(event:EditablePopupDataEvent)=>{
			const payload = {
				id:event.mid,
				eltype:event.eltype,
				title:event.title,
				description:event.description
			}
			//console.log(payload);
			if(!this.mapcontext)
				return;

			if(payload.eltype == 'marker')
				this.mapcontext.editMarkerData(payload);
			if(payload.eltype == 'shape')
				this.mapcontext.editShapeData(payload);
            this.saveChanges('data-change');
			this.mapui.update();
		});




        // @ts-ignore
        this.map.on('set-current-draw-mode',(event:any)=>{
            this.currentDrawMode = event.dmode;
        });

		this.map.on('shape-drawn',(event:any)=>{
            console.log("Received => ",event.shape);
            if(event.shape.properties.mode != 'point'){
                this.addShape(event.shape);
                this.saveChanges('shape-add');
            }else{
                this.addMarker(event.shape);
                this.saveChanges('marker-add');
            }
		})

		// @ts-ignore
		this.map.on('form-popup-submit',(event:any)=>{
			if(event.actiontype != 'save')
				return;
			if(event.formtype == 'map-info'){
				this.mapcontext?.setTitle(event.title);
				this.mapcontext?.setDescription(event.description);
                this.saveChanges('map-info');
			}
			if(event.formtype == 'layer-info'){
				this.mapcontext?.getLayer(event.layerid)?.setName(event.title);
                this.saveChanges('layer-info');
			}
		})
	}


    
    addShape(shape:MapTypes.Shape){
        if(!this.mapcontext)
            return;

        if(this.mapcontext.isShapeExists(shape.id)){
            this.mapcontext.editShapeGeometry(shape);
            return;
        }

        
		shape.properties['title'] = shape.geometry.type;
		shape.properties['description'] = "This is a shape";

        const selectedLayer = this.mapcontext.getSelectedLayer();
		this.selectedlayerid = selectedLayer.layerid;
		selectedLayer.addShape(shape);

        this.refreshMap();
        this.updateui();
	}

	

	addMarker(marker:MapTypes.Marker){
        if(!this.mapcontext)
            return;

        if(this.mapcontext.isMarkerExists(marker.id)){
            this.mapcontext.editMarkerPosition(marker);
            return;
        }

        marker.properties['title'] = 'Marker';
		marker.properties['description'] = "This is a marker";

		const selectedLayer = this.mapcontext.getSelectedLayer();
		this.selectedlayerid = selectedLayer.layerid;
		selectedLayer.addMarker(marker);
        this.refreshMap();

        this.updateui();
	}

}
