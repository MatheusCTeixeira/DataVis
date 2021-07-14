import { ClassGetter } from '@angular/compiler/src/output/output_ast';
import { Component, Input, OnInit } from '@angular/core';
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

  @Input()
  tweetCoords;

  @Input()
  userLocations;

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

    });

    [this.userLocations, this.tweetCoords].forEach(values => {
      let maxValue = null;
      for (let week of values) {
        delete week["week"];
        const counts = Object.values(week).map(v => +v);
        if (maxValue == null || d3.max(counts) > maxValue)
          maxValue = d3.max(counts);
      }
      this.maxValue += maxValue;
      console.log("Max", this.maxValue);
    })

    d3.json("assets/brazil_map.geojson").then((data: any) => {
      this.map = data;
      this.plotWeek({first: true});
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
                            .attr("fill", d => this.setColor(d))
                            .call((sel) => this.tooltip(sel))

                          // enter.append("text")
                          //   .attr("transform", d => `translate(${geoGenerator.centroid(d)})`)
                          //   .attr("dominant-baseline", "middle")
                          //   .attr("text-anchor", "middle")
                          //   .attr("fill", "black")
                          //   .html(d=> {
                          //     const week_no = this.week_selected.value;
                          //     const state = d.properties.NOME;
                          //     const sigla = d.properties.SIGLA;
                          //     const n = this.weeks[week_no][state];

                          //     return `${sigla} - ${n}`;
                          //   });

        },
        (update: any) => update
                          .attr("fill", d => this.setColor(d))

      )
  }

  setColor(d: any) {
    if (!this.maxValue) return 0;
    const week = +this.week_selected.value;
    const estado = d.properties.NOME;
    const sigla = d.properties.SIGLA;
    const n = +this.userLocations[week][sigla] + +this.tweetCoords[week][sigla];
    const color = 255 * (1 - n/this.maxValue);
    console.log("color", this.userLocations[week]);

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
                          .attr("fill", d => this.setColor(d))
                          .call(sel => this.tooltip(sel))
      )
  }

  smallMultiples() {
    for (let i: number = 0; i < 6; ++i) {
      for (let j: number = 0; j < 6; ++j) {
        if (i * 6 + j + 1 >= 36)
          break;
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

  tooltipHtml(d) {
    const prop = d.properties;
    const sigla = prop.SIGLA;
    const estado = prop.NOME;
    const semana = this.week_selected.value;
    const n_coords = this.tweetCoords[semana][sigla];
    const n_locations = this.userLocations[semana][sigla];

    return `
    <div style="display: flex; justify-content: flex-start; flex-flow: column;">
    <div style="align-self: center;">ESTATÍSTICAS</div>

      <div>${estado} - ${sigla}</div>
      <div>${semana}ª semana</div>
      <div>${n_coords} coordinates</div>
      <div>${n_locations} locations</div>
    </div>
    `;
  }

  tooltip(selection) {
    const tooltip = d3.select("#tooltip");
    selection
       .on("mouseover", (e, data) => {
          const t = d3.transition().duration(400).ease(d3.easeLinear);

          tooltip
          .html(d => this.tooltipHtml(data))
          .style("visibility", "visible")
          .style("opacity", 0)
          .transition(t)
          .style("opacity", 1)
        })
        .on("mousemove", e => {
          tooltip
            .style("visibility", "visible")
            .style("left", e.pageX + 20 + "px")
            .style("top", e.pageY + "px");
        })
        .on("mouseout", () => {
          const t = d3.transition().duration(400).ease(d3.easeLinear)
          tooltip
          .style("opacity", 1)
          .transition(t)
          .style("opacity", 0)
          .style("visibility", "hidden");
        });
  }
}
