import { Feature, Geometry } from 'geojson';
import * as L from 'leaflet';
export interface EditablePopupDataEvent extends L.LeafletEvent {
    latlng: L.LatLng;
	title:string;
	description:string;
	mid:string;
	eltype:'marker'|'shape';
}



export class WatermarkControl extends L.Control{

	private _clickListener:(event:any)=> undefined = (e:any) => undefined;
	constructor(opts?:L.ControlOptions){
		super(opts);
	}

	override onAdd(map: L.Map): HTMLElement {
		const container = L.DomUtil.create('h1','leaflet-watermark');
  
        container.textContent = "My Maps"
        container.style.width = '200px';
        container.style.fontSize = '3.5em';
        container.style.color = 'red';

		L.DomEvent.on(container,'click',(event)=>{
			this._clickListener(event);
			L.DomEvent.stopPropagation(event);
		},this);
        return container;
	}

	addClickListener(func:(event:any)=>undefined){
		this._clickListener = func
	}
}

var Watermark = L.Control.extend({
	options:{
		position:'topright'
	},
	_clickListener:(event:any)=> undefined,
    onAdd: function(map:L.Map) {
        const container = L.DomUtil.create('h1','leaflet-watermark');
  
        container.textContent = "My Maps"
        container.style.width = '200px';
        container.style.fontSize = '3.5em';
        container.style.color = 'red';

		L.DomEvent.on(container,'click',(event)=>{
			this._clickListener(event);
			L.DomEvent.stopPropagation(event);
		},this);
        return container;
    },

	addClickListener(func:(event:any)=>undefined){
		this._clickListener = func
	}
});

//export type WatermarkControl = typeof Watermark;
  
export const watermark = function(opts?: L.ControlOptions) {
    return new WatermarkControl(opts);
}


const DefaultIcon = L.icon({
    iconUrl: "./assets/marker.png",
    iconSize: [25, 25]
});

export const marker = (latlng:L.LatLngExpression,opts?:L.MarkerOptions) => L.marker(latlng,{...opts,icon:DefaultIcon});

class EditablePopup extends L.Popup{
	private _titleContent:string;
	private	_description:string;
	private _dataListener!:(data:{mid:string,title:string,description:string,latlng:L.LatLng}) => undefined;
	_container!: HTMLDivElement;
	_wrapper!: HTMLDivElement;
	_contentNode!: HTMLDivElement;
	_tipContainer!: HTMLDivElement;
	_tip!: HTMLDivElement;
	_closeButton!: HTMLAnchorElement;
	_titleNode!: HTMLDivElement | HTMLInputElement;
	_descNode!: HTMLDivElement | HTMLTextAreaElement;
	_buttonGrp!: HTMLDivElement;
	_latlangInfo!: HTMLDivElement;
	_editBtn!: HTMLAnchorElement;
	_saveBtn!: HTMLButtonElement;
	_cancelBtn!: HTMLButtonElement;
	_id: string;
	eltype: string;
	
	constructor(feature:Feature<Geometry, any>){
		super();
		this._id = feature.id as string;
		this.eltype = feature.properties['mode'] == 'point'?'marker':'shape';
		this._titleContent = feature.properties['title'] as string;
		this._description = feature.properties['description'] as string;
	}
	
	callDataListener(data:{mid:string,eltype:string,title:string,description:string}){
		if(this._dataListener){
			// @ts-ignore
			this._dataListener({...data,latlng:this.getLatLng()});
		}
	}
	getTitleContent(){
		return this._titleContent
	}
	setTitleContent(text:string){
		this._titleContent = text
	}
	getDescContent(){
		return this._description
	}
	setDescContent(text:string){
		this._description = text
	}
	_initLayout() {
		const prefix = 'leaflet-popup';
		const container = this._container = L.DomUtil.create('div', `${prefix} my-popup ${this.options.className || ''} leaflet-zoom-animated`);
		
		const wrapper = this._wrapper = L.DomUtil.create('div', `${prefix}-content-wrapper`, container);
		this._contentNode = L.DomUtil.create('div', `${prefix}-content`, wrapper);

		L.DomEvent.disableClickPropagation(container);
		L.DomEvent.disableScrollPropagation(this._contentNode);
		L.DomEvent.on(container, 'contextmenu', L.DomEvent.stopPropagation);

		this._tipContainer = L.DomUtil.create('div', `${prefix}-tip-container`, container);
		this._tip = L.DomUtil.create('div', `${prefix}-tip`, this._tipContainer);

		const closeButton = this._closeButton = L.DomUtil.create('a', `${prefix}-close-button`, container);
		closeButton.setAttribute('role', 'button'); // overrides the implicit role=link of <a> elements #7399
		closeButton.setAttribute('aria-label', "Close Popup");

		closeButton.href = '#close';
		closeButton.innerHTML = '<span aria-hidden="true">&#215;</span>';

		L.DomEvent.on(closeButton, 'click',  (ev) => {
			L.DomEvent.preventDefault(ev);
			this.close();
		}, this);
		this.createDisplayMode();

	}
	createDisplayMode() {
		const prefix = 'leaflet-popup';
		this._titleNode = L.DomUtil.create('div',`${prefix}-div-title`,this._wrapper);
		this._titleNode.textContent = this.getTitleContent();
		this._descNode = L.DomUtil.create('div',`${prefix}-div-description`,this._wrapper);
		this._descNode.textContent = this.getDescContent();

		this._buttonGrp = L.DomUtil.create('div',`${prefix}-div-btn-grp dispmode`,this._wrapper);
		
		this._latlangInfo = L.DomUtil.create('div',`${prefix}-div-latlng`,this._buttonGrp);
		const latlang = L.Popup.prototype.getLatLng.call(this);
		this._latlangInfo.textContent = `${latlang?.lat.toFixed(4)},${latlang?.lng.toFixed(4)}`;

		this._editBtn = L.DomUtil.create('a', `${prefix}-edit-button`, this._buttonGrp);
		this._editBtn.setAttribute('role', 'button');
		this._editBtn.setAttribute('aria-label', 'Edit');
		this._editBtn.href = '#open';
		this._editBtn.innerHTML = `<img src='/assets/ui-icons/edit-icon.png' width='21px' height='21px' />`
		// this._editBtn = L.DomUtil.create('div',`${prefix}-div-btn save-btn`,this._buttonGrp);
		// this._editBtn.textContent = "Edit";

		L.DomEvent.on(this._editBtn,'click', (ev) => {
			L.DomEvent.preventDefault(ev);
			this._onEditBtnClick(ev);
		},this);
	}
	_onEditBtnClick(e: L.DomEvent.PropagableEvent) {
		console.log("Clicked");
		const prefix = 'leaflet-popup';
		this._wrapper.removeChild(this._titleNode);
		this._wrapper.removeChild(this._descNode);
		this._titleNode = L.DomUtil.create('input',`${prefix}-div-title`,this._wrapper);
		// @ts-ignore
		this._titleNode.value = this.getTitleContent();
		this._descNode = L.DomUtil.create('textarea',`${prefix}-div-description`,this._wrapper);
		this._descNode.rows = 6;
		this._descNode.cols = 37;
		this._descNode.style.resize = 'none';
		this._descNode.value = this.getDescContent();
		this._buttonGrp.removeChild(this._latlangInfo);
		this._buttonGrp.removeChild(this._editBtn);
		this._wrapper.removeChild(this._buttonGrp);

		this._buttonGrp = L.DomUtil.create('div',`${prefix}-div-btn-grp editmode`,this._wrapper);
		this._saveBtn = L.DomUtil.create('button',`${prefix}-div-btn`,this._buttonGrp);
		this._saveBtn.textContent = "Save";

		L.DomEvent.on(this._saveBtn,'click',this._onSaveBtnClick,this);

		this._cancelBtn = L.DomUtil.create('button',`${prefix}-div-btn`,this._buttonGrp);
		this._cancelBtn.textContent = "Cancel";

		L.DomEvent.on(this._cancelBtn,'click',this._onCancelBtnClick,this);

		L.DomEvent.stopPropagation(e);
		var location = this.getLatLng();
		if(location){
			this._map.panTo(location);
		}
			
	}
	_onSaveBtnClick(e: L.DomEvent.PropagableEvent) {
		// @ts-ignore
		this.setTitleContent(this._titleNode.value);
		// @ts-ignore
		this.setDescContent(this._descNode.value);
		this.callDataListener({mid:this._id,eltype:this.eltype,title:this.getTitleContent(),description:this.getDescContent()});
		const prefix = 'leaflet-popup';
		this._wrapper.removeChild(this._titleNode);
		this._wrapper.removeChild(this._descNode);
		this._buttonGrp.removeChild(this._saveBtn);
		this._buttonGrp.removeChild(this._cancelBtn);
		this.createDisplayMode();
		L.DomEvent.stopPropagation(e);
	}
	_onCancelBtnClick(e: L.DomEvent.PropagableEvent) {
		const prefix = 'leaflet-popup';
		this._wrapper.removeChild(this._titleNode);
		this._wrapper.removeChild(this._descNode);
		this._buttonGrp.removeChild(this._saveBtn);
		this._buttonGrp.removeChild(this._cancelBtn);
		this.createDisplayMode();
		L.DomEvent.stopPropagation(e);
	}

	override onAdd(map: L.Map): this {
		super.onAdd(map);
		
		this._dataListener = function (data:{mid:string,title:string,description:string,latlng:L.LatLng}) {
			map.fire("popup-data-change",data);
		};
		
		
		return this;
	}
}

export const editablePopup = (feature: Feature<Geometry, any>) => new EditablePopup(feature);

