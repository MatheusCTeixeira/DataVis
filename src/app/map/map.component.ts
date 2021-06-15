import { Component, OnInit } from '@angular/core';
import * as d3 from "d3";
import * as d3Geo from "d3-geo"
@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  data = [1, 2, 3, 4];

  constructor() { }

  ngOnInit(): void {
    const svg = d3.select("#map")
      .append("svg")
        .attr("width", "800px")
        .attr("height", "800px")
        .attr("viewBox", "0 0 800 800")
      .append("g");



    d3.json("assets/brasil.geojson")
      .then((data: any) => {

        let projection = d3Geo.geoEquirectangular().scale(300);
        let geoGenerator = d3Geo.geoPath().projection(projection);
        console.log(data.features.length);
        svg.selectAll("path")
        .data(data.features)
        .join(
          (enter: any) => enter.append("path")
                            .attr("d", geoGenerator)
                            .attr("stroke", "red")
                            .attr("stroke-width", 1)
                            .attr("fill", "none")
        );

     });
  }
}
