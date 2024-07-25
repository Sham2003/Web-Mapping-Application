import { Component, OnInit, inject, Input } from '@angular/core';
import { Router,ActivatedRoute, NavigationStart } from '@angular/router';

import { MapItem, MapService } from '../map-service/maps.service';
import { MyMap } from '../map-ui/mymap-component';
import { Subscription } from 'rxjs';


@Component({
	selector: 'app-map-container',
	standalone: true,
	imports: [],
	templateUrl: './map-container.component.html',
	styleUrl: './map-container.component.css',
	providers:[Router]
})
export class MapContainerComponent implements OnInit {
	mymap!:MyMap
	mapctx!: MapItem|undefined;
	id?:string|null;
	private router:Router = inject(Router);
	private mapservice:MapService = inject(MapService);
	subsciption!:Subscription;

	constructor(private activatedRoute: ActivatedRoute) {
	}


	ngOnInit(): void {
		this.mymap = new MyMap("map",this.router);
		this.subsciption = this.mymap.getChangeObservable$().subscribe((request) => {
			//console.log("Save Request :",request);
			this.saveToStorage();
		})
		this.router.events.subscribe((event)=>{
			if(event instanceof NavigationStart){
				//this.mapservice.refresh();
			}
		})
		this.activatedRoute.paramMap.subscribe(paramsId => {
			this.id = paramsId.get('id');
			if(this.id){
				this.mapctx = this.mapservice.getMap(this.id);
				//console.log("Map Object changed for ",this.id," Object=> ",this.mapctx?.toString());
				if(this.mapctx){
					this.mymap.setMapContext(this.mapctx);
				}else{
					this.router.navigate(['/']);
				}
			}
		});
	}

	saveToStorage(){
		if(this.mapservice){
			this.mapservice.saveState();
		}
	}

}


