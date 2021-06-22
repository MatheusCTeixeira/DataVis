import { ClassGetter } from '@angular/compiler/src/output/output_ast';
import { Component, OnInit } from '@angular/core';
import * as d3 from "d3";
import * as d3Geo from "d3-geo";
import * as d3ToPng from 'd3-svg-to-png';

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



    d3.json("assets/gadm36_BRA_1.geojson")
      .then((data: any) => {

        let projection = d3Geo.geoEquirectangular()
          .scale(300)
          .center([-15.595833, -56.096944])
          .fitExtent([[0, 0], [800, 800]], data);
        let geoGenerator = d3Geo.geoPath().projection(projection);
        svg.selectAll("path")
        .data(data.features)
        .join(
          (enter: any) => enter.append("path")
                            .attr("d", geoGenerator)
                            .attr("stroke", "#000")
                            .attr("stroke-width", 1)
                            .attr("fill", "#DDD")
        );

        return projection;
     })
     .then(projection => {
        d3.json("assets/coordinates.json")
        .then((data: Object) => {
          const weeks = new Array<Object>();
          for (let i = 1; i <= 37; ++i)
            weeks.push(data[`${i}`]);

          let coordinates = [];
          weeks.forEach((week, i) => {
            for (let user in week)
              coordinates = coordinates.concat(week[user]);
          });

          svg.selectAll("point")
          .data(coordinates)
          .join(
            (enter) => enter.append("circle")
                        .attr("cx", d => projection(d.coordinates)[0])
                        .attr("cy", d => projection(d.coordinates)[1])
                        .attr("r", 2)
                        .attr("fill", "rgba(255, 0, 0, 0.3)")

          )

        return projection;
     })
    });
  }

  download() {
    console.log("Downloading...")
      d3ToPng.default("#map svg", "map.jpg", {})
        .then(res => {
          console.log(res);
        })
  }
}
