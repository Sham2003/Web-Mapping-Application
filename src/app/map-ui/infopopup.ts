import { Feature, Geometry ,LineString,Polygon} from 'geojson';
import * as L from 'leaflet';
import 'leaflet-draw'

function lineStringLength(lineString: number[][]): number {
    const earthRadius = 6371; // Earth's radius in kilometers
    const coords = lineString;
    let totalLength = 0;

    if (coords && coords.length > 1) {
        for (let i = 0; i < coords.length - 1; i++) {
            totalLength += haversineDistance(coords[i], coords[i + 1], earthRadius);
        }
    }

    return totalLength;
}

function haversineDistance(coord1: number[], coord2: number[], radius: number): number {
    const lat1 = coord1[1] * PI_OVER_180;
    const lat2 = coord2[1] * PI_OVER_180;
    const dLat = (coord2[1] - coord1[1]) * PI_OVER_180;
    const dLon = (coord2[0] - coord1[0]) * PI_OVER_180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return radius * c;
}


function polygonArea(polygon: Polygon) {
	const coords = polygon.coordinates;
	let total = 0;
	if (coords && coords.length > 0) {
		total += Math.abs(ringArea(coords[0]));
		for (let i = 1; i < coords.length; i++) {
			total -= Math.abs(ringArea(coords[i]));
		}
	}
	return total;
}
const earthRadius = 6371008.8;
const FACTOR = (earthRadius * earthRadius) / 2;
const PI_OVER_180 = Math.PI / 180;

function ringArea(coords: number[][]): number {
	const coordsLength = coords.length;

	if (coordsLength <= 2) {
		return 0;
	}

	let total = 0;

	let i = 0;
	while (i < coordsLength) {
		const lower = coords[i];
		const middle = coords[i + 1 === coordsLength ? 0 : i + 1];
		const upper =
			coords[i + 2 >= coordsLength ? (i + 2) % coordsLength : i + 2];

		const lowerX = lower[0] * PI_OVER_180;
		const middleY = middle[1] * PI_OVER_180;
		const upperX = upper[0] * PI_OVER_180;

		total += (upperX - lowerX) * Math.sin(middleY);

		i++;
	}

	return total * FACTOR;
}

export interface EditablePopupDataEvent extends L.LeafletEvent {
    latlng: L.LatLng;
	title:string;
	description:string;
	mid:string;
	eltype:'marker'|'shape';
}

function calcArea(g:Polygon) {
	var latLngs = g.coordinates[0].map((p) => L.latLng(p[0],p[1]))
	var pointsCount = latLngs.length,
		area = 0.0,
		d2r = Math.PI / 180,
		p1, p2;

	if (pointsCount > 2) {
		for (var i = 0; i < pointsCount; i++) {
			p1 = latLngs[i];
			p2 = latLngs[(i + 1) % pointsCount];
			area += ((p2.lng - p1.lng) * d2r) *
				(2 + Math.sin(p1.lat * d2r) + Math.sin(p2.lat * d2r));
		}
		area = area * 6378137.0 * 6378137.0 / 2.0;
	}

	area /= 1000*1000;
	area = Math.abs(area);
	return area.toFixed(2);;
}

function calcPerimeter(g:LineString){
	var length = 0; 
	var coords = g.coordinates;
	var n = g.coordinates.length - 1;
	for(let i=0;i<n;i++){
		var coord1 = L.latLng(coords[i][0],coords[i][1]);
		var coord2 = L.latLng(coords[i+1][0],coords[i+1][1]);
		length += coord1.distanceTo(coord2);
	}
	length /= 1000;
	return length.toFixed(1);
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
	_popupInfo!: HTMLDivElement;
	_editBtn!: HTMLAnchorElement;
	_saveBtn!: HTMLButtonElement;
	_cancelBtn!: HTMLButtonElement;
	_id: string;
	eltype: string;
	private _featuredata: Feature<Geometry, any>;
	
	constructor(feature:Feature<Geometry, any>){
		super();
		this._id = feature.id as string;
		this.eltype = feature.properties['mode'] == 'point'?'marker':'shape';
		this._titleContent = feature.properties['title'] as string;
		this._description = feature.properties['description'] as string;
		this._featuredata = feature;
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
		
		if(this._featuredata.geometry.type == "Point")
		{
			this._popupInfo = L.DomUtil.create('div',`${prefix}-div-latlng`,this._buttonGrp);
			const latlang = L.Popup.prototype.getLatLng.call(this);
			this._popupInfo.textContent = `${latlang?.lat.toFixed(4)},${latlang?.lng.toFixed(4)}`;
		}else if(this._featuredata.geometry.type == 'LineString'){
			this._popupInfo = L.DomUtil.create('div',`${prefix}-div-perimeter`,this._buttonGrp);
			const perimeter = lineStringLength(this._featuredata.geometry.coordinates);
			this._popupInfo.textContent = `Perimeter = ${perimeter.toFixed(1)} Km`;
		}else if(this._featuredata.geometry.type == 'Polygon'){
			this._popupInfo = L.DomUtil.create('div',`${prefix}-div-area`,this._buttonGrp);
			const area =  polygonArea(this._featuredata.geometry)/(1000*1000);
			this._popupInfo.textContent = `Area = ${area.toFixed(2)} Km2`;
		}else{

		}
		

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
		this._buttonGrp.removeChild(this._popupInfo);
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

