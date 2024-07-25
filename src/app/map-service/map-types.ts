import { GeoJSONStoreFeatures } from "terra-draw";


export namespace MapTypes{
    export type Shape = GeoJSONStoreFeatures;
    export type Shapes = Shape[];
    export type Marker = GeoJSONStoreFeatures;
    // export type Marker = {
    //     id:string,
    //     latlng:[number,number],
    //     title:string,
    //     description:string
    // }
    
    
    export type MapFeatureData = {
        id:string,
        eltype:'marker'|'shape',
        title:string,
        description:string
    }
    export type MapLayerObject = {
        id: string;
        name: string;
        markers: Marker[];
        shapes: Shapes;
        selected: boolean;
        visible:boolean;
    };

    export type MapObject = {
        id: string;
        name: string;
        descr: string;
        created: string;
        layers:MapTypes.MapLayerObject[];
        selected_layer: string | undefined;
    }

    export type LayerInfo = {
        id:string,
        name:string,
        markerinfo:{mid:string,mname:string}[],
        shapeinfo:{sid:string,sname:string}[],
        selected:boolean,
        visible:boolean
    }
}