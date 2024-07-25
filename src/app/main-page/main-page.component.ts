import { CommonModule } from '@angular/common';
import { Component,OnInit ,inject } from '@angular/core';
import { Router } from '@angular/router';
import { MapItem, MapService } from '../map-service/maps.service';




@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css',
  providers:[Router]
})
export class MainPageComponent implements OnInit{

  private maps: MapItem[] = [];
  private mapservice:MapService = inject(MapService)
  constructor(private router:Router){ 
    this.maps = this.mapservice.getMaps();
  }
  ngOnInit(): void {
    this.maps = this.mapservice.getMaps();
  }

  getMaps(){
    return this.maps;
  }  

  goToMap(id:string) {
    this.router.navigateByUrl(`/map/${id}`);
  }

  newMap(){
    var mapid = this.mapservice.createMap();
    this.mapservice.saveState();
    this.router.navigateByUrl(`/map/${mapid}`);
  }

  deleteMap(id:string){
    if(confirm("Delete this map")){
      this.mapservice.deleteMap(id);
      this.mapservice.saveState();
    }
  }
  
}
