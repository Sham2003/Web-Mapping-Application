import L from "leaflet";
import { TerraDraw, TerraDrawLeafletAdapter, TerraDrawSelectMode, TerraDrawPointMode, TerraDrawLineStringMode, ValidateNotSelfIntersecting, TerraDrawRectangleMode, ValidateMinAreaSquareMeters, TerraDrawCircleMode, TerraDrawPolygonMode, TerraDrawFreehandMode } from "terra-draw";
import { OnFinishContext } from "terra-draw/dist/common";
import { FeatureId } from "terra-draw/dist/store/store";
import { DrawControl } from "./draw-control";
import { MapTypes } from "../map-service/map-types";
import { TerraDrawBaseDrawMode } from "terra-draw/dist/modes/base.mode";
import 'leaflet-draw';
type DrawModes = 'circle'|'freehand'|'linestring'|'point'|'polygon'|'rectangle'|'select'|''|'mypolygon';
type UIDrawMode = {name:DrawModes,mode:TerraDrawBaseDrawMode<any>}

export class DrawMapUI{
    private drawctx!:TerraDraw;
    private drawui!: DrawControl.DrawControlUI;
    private _map:L.Map;
    private data:any[] = [];
    drawingmodes!: UIDrawMode[];
    currentDrawMode: DrawModes;
    private leafletdraw!:L.Control;
    private _element: HTMLElement;
    private _polyButton!:HTMLAnchorElement;

    public update(){
        this.drawui._update()
    }

    constructor(map:L.Map){
        this._map = map;
        this._element = map.getContainer();
        this.currentDrawMode = '';
        this.initControl();
    }

    initControl(){
        this.initDrawControl();
        this.initLeafletDraw();
        // @ts-ignore
        this._map.on('set-draw-mode',(event:any)=>{
            this.setDrawMode(event.dmode);
            //console.log('set-current-draw-mode fired = ',this.currentDrawMode);
            this._map.fire('set-current-draw-mode',{dmode:this.currentDrawMode});
        });
    }

    private initDrawControl(){
        this.getDrawingModes();
        var modes =  this.drawingmodes.map((m) => m.mode)
        var modenames = this.drawingmodes.map((m) => m.name)
        this.drawctx = new TerraDraw({
            adapter: new TerraDrawLeafletAdapter({
                lib: L,
                map:this._map,
            }),
            modes:modes
        });
        
        this.drawctx.on("finish", (id: FeatureId, context: OnFinishContext) => {
            const shapeDrawn = this.drawctx.getSnapshot().find((val) => val.id == id);
            //console.log(shapeDrawn);
            this._map.fire('shape-drawn',{shape:shapeDrawn});	
            if(this.currentDrawMode != 'select')
                this.drawctx.removeFeatures([id]);
        });

        this.drawctx.on('select',(id:FeatureId) => {
            console.log("Selected SHape=> ",id);
        });

        this.drawui = DrawControl.drawcontrolui(this.drawctx,modenames,{position:'topleft'});
        this.drawui.addTo(this._map);
    }


    public initLeafletDraw(){
        var PolygonOptions = {
            allowIntersection: false,
            drawError: {
                color: 'red',
                message: '<strong>Oh snap!<strong> you can\'t draw that!' 
            },
            icon: new L.DivIcon({
                iconSize:new L.Point(8,8),
                className: 'mypolygon-editing-icon'
            }),
            guidelineDistance: 1,
            maxGuideLineLength: 4000,
            shapeOptions: {
                color: 'black',
                weight:4,
                opacity:1,
                fillColor:'lightgrey'
            }
        }
        const options = {
            position: 'topleft',
            draw: {
                polyline: false,
                polygon: PolygonOptions,
                circle: false, // Turns off this drawing tool
                rectangle: false,
                marker: false,
                circlemarker:false
            },
            edit: false
        };

        // options: {
        //     allowIntersection: true,
        //     repeatMode: false,
        //     drawError: {
        //         color: '#b00b00',
        //         timeout: 2500
        //     },
        //     icon: new L.DivIcon({
        //         iconSize: new L.Point(8, 8),
        //         className: 'leaflet-div-icon leaflet-editing-icon'
        //     }),
        //     touchIcon: new L.DivIcon({
        //         iconSize: new L.Point(20, 20),
        //         className: 'leaflet-div-icon leaflet-editing-icon leaflet-touch-icon'
        //     }),
        //     guidelineDistance: 20,
        //     maxGuideLineLength: 4000,
        //     shapeOptions: {
        //         stroke: true,
        //         color: '#3388ff',
        //         weight: 4,
        //         opacity: 0.5,
        //         fill: false,
        //         clickable: true
        //     },
        //     metric: true, // Whether to use the metric measurement system or imperial
        //     feet: true, // When not metric, to use feet instead of yards for display.
        //     nautic: false, // When not metric, not feet use nautic mile for display
        //     showLength: true, // Whether to display distance in the tooltip
        //     zIndexOffset: 2000, // This should be > than the highest z-index any map layers
        //     factor: 1, // To change distance calculation
        //     maxPoints: 0 // Once this number of points are placed, finish shape
        // }

        // options: {
        //     showArea: false,
        //     showLength: false,
        //     shapeOptions: {
        //         stroke: true,
        //         color: '#3388ff',
        //         weight: 4,
        //         opacity: 0.5,
        //         fill: true,
        //         fillColor: null, //same as color by default
        //         fillOpacity: 0.2,
        //         clickable: true
        //     },
        //     // Whether to use the metric measurement system (truthy) or not (falsy).
        //     // Also defines the units to use for the metric system as an array of
        //     // strings (e.g. `['ha', 'm']`).
        //     metric: true,
        //     feet: true, // When not metric, to use feet instead of yards for display.
        //     nautic: false, // When not metric, not feet use nautic mile for display
        //     // Defines the precision for each type of unit (e.g. {km: 2, ft: 0}
        //     precision: {}
        // }
        
        //@ts-ignore
        this.leafletdraw = new L.Control.Draw(options);
        this._map.addControl(this.leafletdraw);

        // @ts-ignore
        this._map.on(L.Draw.Event.CREATED, (e: any) => {
            const type = e.layerType;
            const layer = e.layer;
            const s:MapTypes.Shape = layer.toGeoJSON();
            if(s){
                s.id = this.drawctx.getFeatureId();
                s.properties['mode'] = 'polygon';
                console.log("Shape done ",s);
                this._map.fire('shape-drawn',{shape:s});	
            }
        });

        this._map.on('draw:drawstart', (e: any) => {
            this.setDrawMode('mypolygon');
            //console.log("Selcted mode ",this.currentDrawMode);
            this.changeButtonStyle();
            this.drawui.setSelectedMode(this.currentDrawMode);
            this._map.fire('set-current-draw-mode',{dmode:this.currentDrawMode});
        });

        this._map.on('draw:drawstop', (e: any) => {
            this.setDrawMode('');
            //console.log("Selcted mode ",this.currentDrawMode);
            this.resetButtonStyle();
            this.drawui.setSelectedMode(this.currentDrawMode);
            this._map.fire('set-current-draw-mode',{dmode:this.currentDrawMode});
        });


    }

    changeButtonStyle(){
        if(!this._polyButton){
            var buttons = document.getElementsByClassName('leaflet-draw-draw-polygon')
            this._polyButton = buttons[0] as HTMLAnchorElement;
        }

        this._polyButton.style.setProperty('background-color', '#dde051')

    }

    resetButtonStyle(){
        this._polyButton.style.setProperty('background-color', 'white')

    }

    setDrawMode(x:DrawModes){
        if(this.currentDrawMode == x){
            //unset
            if(this.currentDrawMode == 'select'){
                this.stopTerraDrawMode();
            }else if(this.currentDrawMode == 'mypolygon'){
            }
            else {
                this.drawctx.stop();
            }
            this.currentDrawMode = '';
            this._map.fire('set-current-draw-mode',{dmode:this.currentDrawMode});
            this.drawui.setSelectedMode('');
            this.clearMouseCursor();
            this._map.fire('refresh-layer');
        }else{
            //set
            if(this.currentDrawMode == 'select'){
                //stop edit mode
                this.stopTerraDrawMode();
            }else{
                this.drawctx.stop();
            }
            if(x == 'select'){
                this.goToSelectMode();
            }else if(x =='mypolygon' || x == ''){

            }else {
                this.drawctx.start();
                this.drawctx.setMode(x);
            }
            this.currentDrawMode = x;
            this._map.fire('set-current-draw-mode',{dmode:this.currentDrawMode});
            this.drawui.setSelectedMode(x);
            this._map.closePopup();
            //this._map.fire('refresh-layer');
            //this.refreshLayers();
        }
        this.drawui._update()
    }

    clearMouseCursor(){
        if(this._element ){
            this._element.style.cursor = 'auto';
        }
    }

    goToSelectMode(){
        //this.clearLayers();
        this._map.fire('clear-layers');
        this._map.fire('get-editable-data');
        //console.log(this.data);
        //console.log("Cleared Layers");
        this.drawctx.start();
        this.drawctx.clear();
        for(const ld of this.getEditableData()){
            if(ld.visible){
                this.drawctx.addFeatures(ld.shapes);
                this.drawctx.addFeatures(ld.markers);
            }
        }
        // console.log('features saved');
        this.drawctx.setMode('select');
    }


    getEditableData() {
        return this.data;
    }

    setEditableData(d: any){
        this.data = d;
    }

    stopTerraDrawMode(){
        if(!this.drawctx.enabled)
            return;
        this.drawctx.clear();
        this.drawctx.stop();
        this._map.fire('refresh-layer');
        //this.refreshLayers();
    }


    removeControl(){
        this._map.removeControl(this.leafletdraw);
        this._map.removeControl(this.drawui);
    }

    addControl(){
        this._map.addControl(this.drawui);
        this._map.addControl(this.leafletdraw);
    }

    private getDrawingModes(){
        this.drawingmodes =  [ {
			name:'select',
			mode: new TerraDrawSelectMode({
                flags: {
                arbitary: {
                    feature: {},
                },
                polygon: {
                    feature: {
                    scaleable: true,
                    rotateable: true,
                    draggable: true,
                    coordinates: {
                        midpoints: true,
                        draggable: true,
                        deletable: true,
                    },
                    },
                },
                linestring: {
                    feature: {
                    draggable: true,
                    coordinates: {
                        midpoints: true,
                        draggable: true,
                        //deletable: true,
                    },
                    },
                },
                circle: {
                    feature: {
                    draggable: true,
                    },
                },
                point: {
                    feature: {
                    draggable: true,
                    },
                },
                rectangle: {
                    feature: {
                    draggable: true,
                    coordinates: {
                        resizable: 'opposite-web-mercator'
                    }
                    }
                },
                freehand: {
                    feature: {
                    draggable: true,
                    },
                },
                },
            })
		},
        {
            name:'point',
            mode: new TerraDrawPointMode({
                cursors:{
                    create:'crosshair'
                }
            })
        }
        ,
		{
			name:'linestring',
			mode: new TerraDrawLineStringMode({
				//snapping: true,
                pointerDistance:30,
				validation: (feature, { updateType }) => {
				if (updateType === "finish" || updateType === "commit") {
					return ValidateNotSelfIntersecting(feature);
				}
				return true
				}
			})
		},
		{
			name:'rectangle',
			mode:new TerraDrawRectangleMode({
				validation:(feature, { updateType }) => {
					if (updateType === "finish" || updateType === "commit") {
					    return ValidateMinAreaSquareMeters(feature,0.1);
					}
					return true
				}
			})
		},
		{
			name:'circle',
			mode:new TerraDrawCircleMode({
				startingRadiusKilometers:0.1,
				validation:(feature, { updateType }) => {
					if (updateType === "finish" || updateType === "commit") {
					    return ValidateMinAreaSquareMeters(feature,0.1);
					}
					return true
				}
			})
		},
		{
			name:'polygon',
			mode:new TerraDrawPolygonMode({
				//snapping: true,
				pointerDistance: 30,
				validation: (feature, { updateType }) => {
				if (updateType === "finish" || updateType === "commit") {
					return ValidateNotSelfIntersecting(feature);
				}
				return true
				}
			})
		},
		{
			name:'freehand',
			mode:new TerraDrawFreehandMode({
				validation: (feature) => {
				return ValidateNotSelfIntersecting(feature);
				}
			})
		}
	]
    }
}