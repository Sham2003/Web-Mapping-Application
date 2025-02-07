import * as L from 'leaflet';



export namespace DrawControl{
	export type DrawModes = 'circle'|'freehand'|'linestring'|'point'|'polygon'|'rectangle'|'select'|''|'mypolygon';

	const SKIPBUTTONS:DrawModes[] = ['freehand','circle','rectangle'];

	export class DrawControlUI extends L.Control{
		_map!: L.Map;
		_container!: HTMLElement;
		buttons:HTMLButtonElement[] = [];
		selectedMode!:DrawModes;

		drawingmodes:DrawModes[];
		constructor(modes:DrawModes[],options?:L.ControlOptions){
			super(options);
			this.drawingmodes = modes;
		}

		override onAdd(map: L.Map): HTMLElement {
			this._map = map;

			this._initLayout();
			this._update();
		
			return this._container;
		}


		setSelectedMode(s:DrawModes){
			this.selectedMode = s;
		}
		
		_initLayout() {
			const PREFIX = 'leaflet-draw-ui';
			const parent = this._container = L.DomUtil.create('div',`${PREFIX}-div leaflet-control`);
			const className = `${PREFIX}-btn`;

			L.DomEvent.on(parent,'mousewheel',L.DomEvent.stopPropagation);

			for(const modename of this.drawingmodes){
				if(!SKIPBUTTONS.includes(modename)){
					const aLabel = modename != 'select' ? `Add a ${modename}`:'Select a shape';
					const drawButton = DrawControlUI.createAriaImageButton(className,parent,aLabel,`${modename}.png`);
					drawButton.name = modename;
					L.DomEvent.on(drawButton,'click',(event)=>{
						this._map.fire("set-draw-mode",{dmode:modename});
						this._update()
						L.DomEvent.stopPropagation(event);
					},this);
					this.buttons.push(drawButton);
				}
			}

		}
		_update() {
			for(const button of this.buttons){
				if(this.selectedMode == button.name){
					button.style.borderColor = 'red';
				}else{
					button.style.borderColor = '';
				}
			}
		}

		static createAriaImageButton(classname:string,parent?:HTMLElement,arialabel?:string,imgsrc?:string){
			const button = L.DomUtil.create('button', classname, parent);
			button.setAttribute('title', arialabel || "");
			const innerImage = L.DomUtil.create('img', '', button);
			innerImage.src = './assets/drawcontrol/'+imgsrc;
			innerImage.alt = "N";
			innerImage.width = 30;
			innerImage.height = 30;
			return button;
		}
	}



	export const drawcontrolui = function(modes:DrawModes[],options?:L.ControlOptions){
		return new DrawControlUI(modes,options);
	}
};

	