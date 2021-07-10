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
  height = 800;
  width = 800;
  viewBoxWidth = 800;
  viewBoxHeight = 800;
  maxValue = 0;

  constructor() { }

  ngOnInit(): void {
    this.svg = d3.select("#map")
      .append("svg")
        .attr("width", `${this.width}px`)
        .attr("height", `${this.height}px`)
        .attr("viewBox", `0 0 ${this.viewBoxWidth} ${this.viewBoxHeight}`)
      .append("g");


    d3.json("assets/summarized.json").then((weeks: Object) => {
      this.weeks = weeks;
      this.weeks_no = Object.keys(weeks);
      for (const key of this.weeks_no) {
        const maxV = d3.max(Object.values(this.weeks[key] as number[]));
        if (maxV > this.maxValue)
        this.maxValue = maxV;
      }
      weeks = weeks[0];
        d3.json("assets/gadm36_BRA_1.geojson").then((data: any) => {
          this.map = data;
          this.plotWeek({first: true});
        });
      });

  }

  plotWeek(params?: {first?: boolean}) {
    d3.select("#map").selectAll("*").remove(); // Remove tudo.
    this.svg = d3.select("#map")
        .append("svg")
          .attr("width", `${this.width}px`)
          .attr("height", `${this.height}px`)
          .attr("viewBox", `0 0 ${this.viewBoxWidth} ${this.viewBoxHeight}`)
        .append("g");


    const cuiaba: any = [-15.595833, -56.096944];

    let projection = d3Geo.geoEquirectangular()
      .center(cuiaba)
      .fitExtent([[0, 0], [this.viewBoxWidth, this.viewBoxHeight]], this.map);

    let geoGenerator = d3Geo.geoPath().projection(projection);

    this.svg
      .selectAll("path")
      .data(this.map.features)
      .join(
        (enter: any) => {enter
                          .append("path")
                            .attr("d", geoGenerator)
                            .attr("stroke", "#000")
                            .attr("stroke-width", 1)
                            .attr("fill", d => this.setColor(d));

                          enter.append("text")
                            .attr("transform", d => `translate(${geoGenerator.centroid(d)})`)
                            .attr("dominant-baseline", "middle")
                            .attr("text-anchor", "middle")
                            .attr("fill", "black")
                            .html(d=> {
                              const week_no = this.week_selected.value;
                              const state = d.properties.NAME_1;
                              const sigla = d.properties.HASC_1.split(".")[1];
                              const n = this.weeks[week_no][state];

                              return `${sigla} - ${n}`;
                            });

        },
        (update: any) => update
                          .attr("fill", d => this.setColor(d))

      )
  }

  setColor(d: any) {
    if (!this.maxValue) return 0;
    const week_no = this.week_selected.value;
    const state = d.properties.NAME_1;
    const n = this.weeks[week_no][state];
    const color = 255 * (1 - n/this.maxValue);

    return `rgb(255, ${color}, ${color})`;
  }

  plotSmallMultiples(first: boolean, params?: {i?: number, j?: number}) {
    const [dx, dy] = [this.viewBoxWidth/6, this.viewBoxHeight/6];
    const [x, y] = [params.j*dx, params.i*dy];

    this.svg = d3.select("#map");

    if (first) {
      d3.select("#map").selectAll("*").remove();
      this.svg = this.svg
        .append("svg")
          .attr("width", `${this.width}px`)
          .attr("height", `${this.height}px`)
          .attr("viewBox", `0 0 ${this.viewBoxWidth} ${this.viewBoxHeight}`)
        .append("g");
    }else
      this.svg = this.svg.select("svg").append("g");

    const cuiaba: any = [-15.595833, -56.096944];

    let projection = d3Geo.geoEquirectangular()
      .center(cuiaba)
      .fitExtent([[x, y], [x+dx, y+dy]], this.map);

    let geoGenerator = d3Geo.geoPath().projection(projection);

    this.svg
      .selectAll("path")
      .data(this.map.features)
      .join(
        (enter: any) => enter.append("path")
                          .attr("d", geoGenerator)
                          .attr("stroke", "#000")
                          .attr("stroke-width", 1)
                          .attr("fill", d => this.setColor(d)),
        (update: any) => update
                          .attr("fill", d => this.setColor(d)),

      )
  }

  smallMultiples() {
    for (let i: number = 0; i < 6; ++i) {
      for (let j: number = 0; j < 6; ++j) {
        this.week_selected.setValue(i * 6 + j + 1);
        this.plotSmallMultiples(i==0 && j == 0, {i: i, j: j})
      }
    }
  }

  download() {
    console.log("Downloading...")
      d3ToPng.default("#map svg", "map.jpg", {quality: 100})
        .then(res => {
          console.log(res);
        })
  }
}
