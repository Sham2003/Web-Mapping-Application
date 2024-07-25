import * as L from 'leaflet';
import { FormPopup, formpopup } from './formpopup';
import { MapItem } from '../map-service/map';
import { MapTypes } from '../map-service/map-types';

export class MapControlUI extends L.Control{
	_container!:HTMLElement;
	private title:string = "Untitled Map"
	private description:string = " "
	private _map!: L.Map;
	_infoSection!: HTMLDivElement;
	titleDiv!: HTMLHeadingElement;
	descDiv!: HTMLParagraphElement;
	_controlSection!: HTMLDivElement;
	addLayerButton!: HTMLButtonElement;
	_layerSection!: HTMLDivElement;
	_baseLayerSelector!: HTMLDivElement;
	private _formpopup!: FormPopup | undefined;


	constructor(private _mapobject:MapItem,options?:L.Control.LayersOptions){ 
		super(options);
		L.Util.setOptions(this,options);
		this.title = _mapobject.mapname;
		this.description = _mapobject.description;
	}

	override onAdd(map: L.Map): HTMLElement {
		this._initLayout();
		this.update();

		this._map = map;
	
		return this._container;
	}
	private _updateTitleSection() {
		this.titleDiv.textContent = this.title;
		this.descDiv.textContent = this.description;
	}
	private _initLayout() {
		const className = 'leaflet-mapui',
		    container = this._container = L.DomUtil.create('div', className),
			// @ts-ignore
		    collapsed = this.options.collapsed;

		//L.DomEvent.disableClickPropagation(container);

		this._infoSection = L.DomUtil.create('div',`${className}-info-div`,this._container);
		
		
		this.titleDiv = L.DomUtil.create('h3',`${className}-info-title`,this._infoSection);
		this.titleDiv.textContent = this.title;
		this.descDiv = L.DomUtil.create('p',`${className}-info-desc`,this._infoSection);
		this.descDiv.textContent = this.description;
		
		const mapInfoForm = [
			{
				name:'title',
				default:this.title,
				multiline:false
			},
			{
				name:'description',
				default:this.description,
				multiline:true
			}
		]

		L.DomEvent.on(this.titleDiv,'click',(ev)=>{
			L.DomEvent.preventDefault(ev);
			this.openFormPopup('map-info',mapInfoForm);
			console.log("Opened form")
			L.DomEvent.stopPropagation(ev);
			
		},this);

		L.DomEvent.on(this.descDiv,'click',(ev)=>{
			L.DomEvent.preventDefault(ev);
			this.openFormPopup('map-info',mapInfoForm);
			console.log("Opened form")
			L.DomEvent.stopPropagation(ev);
		},this);
		

		this._controlSection = L.DomUtil.create('div',`${className}-control-div`,this._container);

		this.addLayerButton = L.DomUtil.create('button',`${className}-control-btn`,this._controlSection);
		this.addLayerButton.innerHTML = `<p>Add Layer</p>`

		//add control buttons
		L.DomEvent.on(this.addLayerButton,'click',(ev)=>{
			L.DomEvent.preventDefault(ev);
			this._map.fire('create-layer');
			this._updateLayerSection();
			L.DomEvent.stopPropagation(ev);
		},this);

		this._layerSection = L.DomUtil.create('div',`${className}-layers-div`,this._container);
		for(var layer of this._mapobject.getLayerData()){
			this._addLayer(layer);
		}

		L.DomEvent.on(this._layerSection,'mousewheel',L.DomEvent.stopPropagation);

		this._baseLayerSelector = L.DomUtil.create('div',`${className}-baselayer-div`,this._container);
		this._baseLayerSelector.innerHTML = '<h4>base Layer</h4>'
	}
	_updateLayerSection(){
		while (this._layerSection.lastElementChild) {
			this._layerSection.removeChild(this._layerSection.lastElementChild);
		}
		for(var layer of this._mapobject.getLayerData()){
			this._addLayer(layer);
		}
	}
	openFormPopup(type:string,formdata:any,layerid?:string) {
		if(this._formpopup){
			if(this._formpopup.isOpen())
				return;
			this._formpopup.removeFrom(this._map);
			this._formpopup = undefined;
		}
		const title = type =='map-info'?'Edit Map Info':'Edit Layer Info';
		this._formpopup = formpopup(title,formdata);

		this._formpopup.addDataListener((data:any) =>{
			this._map.closePopup(this._formpopup);
			L.Popup.prototype.remove.call(this._formpopup);
			this._formpopup = undefined;
			if(!data.close){
				this._map.fire('form-popup-submit',{...data,formtype:type,layerid:layerid});
			}
			this.update();
		});
		this._formpopup.setLatLng(this._map.getCenter());
		this._map.closePopup();
		this._formpopup.addTo(this._map);
		console.log("popup opened");
	}
	_addLayer(layer:MapTypes.LayerInfo){
		const newLayer = L.DomUtil.create('div',`leaflet-mapui-layers-block`,this._layerSection);
		if(layer.selected)
			newLayer.classList.add('selected');
		L.DomEvent.on(newLayer,'click',(ev)=>{
			this._map.fire("set-layer",{layerid:layer.id});
			this.update();
			L.DomEvent.stopPropagation(ev);
		},this);
		const topDiv = L.DomUtil.create('div','leaflet-mapui-layers-topdiv',newLayer);

		const visibleButton = L.DomUtil.create('div','visibility-div',topDiv);
		visibleButton.setAttribute('title',`${layer.visible?'Hide':'Show'} Layer`);
		visibleButton.innerHTML = `<img src="/assets/ui-icons/${layer.visible?'visible':'hidden'}.png" width="20px" height="20px">`

		L.DomEvent.on(visibleButton,'click',(ev)=>{
			L.DomEvent.preventDefault(ev);
			this._map.fire(layer.visible?'hide-layer':'show-layer',{layerid:layer.id});
			this.update();
			L.DomEvent.stopPropagation(ev);
		},this);

		const titleSection = L.DomUtil.create('h3','',topDiv);
		titleSection.textContent = layer.name;

		const layerInfoForm = [
			{
				name:'title',
				default:layer.name,
				multiline:false
			}
		]
		L.DomEvent.on(titleSection,'click',(ev)=>{
			L.DomEvent.preventDefault(ev);
			this.openFormPopup('layer-info',layerInfoForm,layer.id);
			L.DomEvent.stopPropagation(ev);
		},this);

		const deleteBtn = L.DomUtil.create('button','leaflet-layer-delbtn',topDiv);
		deleteBtn.setAttribute('title','Delete this layer');
		deleteBtn.innerHTML = '<img src="/assets/ui-icons/layer-delete.png" width="20px" height="20px">';

		L.DomEvent.disableClickPropagation(deleteBtn);
		L.DomEvent.on(deleteBtn,'click',(ev)=>{
			L.DomEvent.preventDefault(ev);
			this._map.fire('delete-layer',{layerid:layer.id});
			L.DomEvent.stopPropagation(ev);
			this.update();
		},this);
		

		if(!layer.visible)
			return;
		const contentSection = L.DomUtil.create('ul','leaflet-mapui-layers-content',newLayer);
		for(const p of layer.markerinfo){
			const item = L.DomUtil.create('li','marker',contentSection);
			item.innerHTML = `<img src='./assets/marker-icon.png' width='20px' height='20px'/><span>${p.mname}</span>`
			const markdeleteBtn = L.DomUtil.create('button','leaflet-layer-delbtn markerdelete',item);
			markdeleteBtn.setAttribute('title','Delete this marker');
			markdeleteBtn.innerHTML = '<img src="/assets/ui-icons/marker-delete.png" width="20px" height="20px">';
			L.DomEvent.on(markdeleteBtn,'click',(ev)=>{
				this._map.fire('delete-marker',{mid:p.mid});
			},this);
		}
		for(const p of layer.shapeinfo){
			const item = L.DomUtil.create('li','shape',contentSection);
			item.innerHTML = `<img src='./assets/polygon-icon.png' width='20px' height='20px'/> ${p.sname}`
			const shapedeleteBtn = L.DomUtil.create('button','leaflet-layer-delbtn shapedelete',item);
			
			shapedeleteBtn.setAttribute('title','Delete this shape');
			shapedeleteBtn.innerHTML = '<img src="/assets/ui-icons/shape-delete.png" width="20px" height="20px">';
			L.DomEvent.on(shapedeleteBtn,'click',(ev)=>{
				this._map.fire('delete-shape',{sid:p.sid});
			},this);
		}
	}
	update(){
		this.title = this._mapobject.getTitle();
		this.description = this._mapobject.getDescription();
		this._updateTitleSection();
		this._updateLayerSection();
	}
}


export const mapui =  function (mapobject: MapItem,options?:L.ControlOptions) {
	return new MapControlUI(mapobject,options);
};