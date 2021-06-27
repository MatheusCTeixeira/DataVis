import { ClassGetter } from '@angular/compiler/src/output/output_ast';
import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as d3 from "d3";
import * as d3Geo from "d3-geo";
import * as d3ToPng from 'd3-svg-to-png';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  svg = null;
  weeks: any;
  weeks_no: any[];
  map: any;
  week_selected = new FormControl(1);

  constructor() { }

  ngOnInit(): void {
    this.svg = d3.select("#map")
      .append("svg")
        .attr("width", "400px")
        .attr("height", "400px")
        .attr("viewBox", "0 0 400 400")
      .append("g");


    d3.json("assets/summarized.json").then((weeks: Object) => {
      this.weeks = weeks;
      this.weeks_no = Object.keys(weeks);
      weeks = weeks[0];
        d3.json("assets/gadm36_BRA_1.geojson").then((data: any) => {
          this.map = data;
          this.selectWeek({first: true});
          this.svg = d3.select("#map")
          .select("svg")
          .select("g");
        });
      });

  }

  selectWeek(params?: {first?: boolean}) {
    const week_no = this.week_selected.value;
    console.log(week_no);

    if (!params?.first) {
      this.svg = d3.select("#map")
      .select("svg")
      .select("g")
    }

    const values = Object.values(this.weeks[week_no]) as number[];
    const max_value = Math.max(...values)
    const cuiaba: any = [-15.595833, -56.096944];

    let projection = d3Geo.geoEquirectangular()
      .center(cuiaba)
      .fitExtent([[0, 0], [400, 400]], this.map);

    let geoGenerator = d3Geo.geoPath().projection(projection);

    this.svg
      .selectAll("path")
      .data(this.map.features)
      .join(
        (enter: any) => enter.append("path")
                          .attr("d", geoGenerator)
                          .attr("stroke", "#000")
                          .attr("stroke-width", 1)
                          .attr("fill", d => {
                            const state = d.properties.NAME_1;
                            const n = this.weeks[week_no][state];
                            const color = 255 * (1 - n/max_value);
                            return `rgb(255, ${color}, ${color})`;
                          }),
        (enter: any) => enter
                          .attr("fill", d => {
                            const state = d.properties.NAME_1;
                            const n = this.weeks[week_no][state];
                            const color = 255 * (1 - n/max_value);
                            return `rgb(255, ${color}, ${color})`;
                          }),

      );
  }

  download() {
    console.log("Downloading...")
      d3ToPng.default("#map svg", "map.jpg", {})
        .then(res => {
          console.log(res);
        })
  }
}
