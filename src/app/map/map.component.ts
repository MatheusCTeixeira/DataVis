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
  data: {key: string, values: [number, number][]}[];

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

    [this.userLocations, this.tweetCoords].forEach(values => {
      let maxValue = null;
      for (let week of values) {
        delete week["week"];
        const counts = Object.values(week).map(v => +v);
        if (maxValue == null || d3.max(counts) > maxValue)
          maxValue = d3.max(counts);
      }
      this.maxValue += maxValue;
    })

    d3.json("assets/brazil_map.geojson").then((data: any) => {
      this.map = data;
      this.plotWeek({first: true});
    });

    this.weeks_no = d3.range(1, 36 + 1, 1);
    this.maxValue = d3.max(d3.merge(this.data.map(v => v.values)).map(tuple => Math.abs(tuple[0] - tuple[1])));
  }

  plotWeek(params?: {first?: boolean}) {
    d3.select("#map").selectAll("*").remove(); // Remove tudo.

    this.svg = d3.select("#map")
        .append("svg")
          .attr("width", `${this.width}px`)
          .attr("height", `${this.height}px`)
          .attr("viewBox", `0 0 ${this.viewBoxWidth} ${this.viewBoxHeight}`)
        .append("g");

    const cuiaba = <[number, number]>[-15.595833, -56.096944];

    let projection = d3Geo.geoEquirectangular()
      .center(cuiaba)
      .fitExtent([[0, 0], [this.viewBoxWidth, this.viewBoxHeight]], this.map);

    let geoGenerator = d3Geo.geoPath().projection(projection);

    const sortFuncA = (a, b) => a.properties.code.localeCompare(b.properties.code);
    const sortFuncB = (a, b) => a.key.localeCompare(b.key);
    this.svg
      .selectAll("path")
      .data(d3.zip(this.map.features.sort(sortFuncA), this.data.sort(sortFuncB)), d => d[1].key)
      .join(
        (enter: any) => {enter
                          .append("path")
                            .attr("d", d => geoGenerator(d[0]))
                            .attr("stroke", "#000")
                            .attr("stroke-width", 1)
                            .attr("fill", d => this.setColor(d[1]))
                            .call((sel, i) => this.tooltip(sel, null))

        },
        (update: any) => update
                          .attr("fill", d => this.setColor(d[0]))

      )
  }

  setColor(d: {key: string, values: [number, number][]}) {
    if (!this.maxValue) return 0;
    const week = +this.week_selected.value - 1;
    const polarity = d.values[week];
    const color = 0.5 * (polarity[0] - polarity[1])/this.maxValue;
    console.log(week, polarity[0], polarity[1], (polarity[0] - polarity[1]), this.maxValue);
    return d3.interpolateRdYlGn(0.5 + color);
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

    const sortFuncA = (a, b) => a.properties.code.localeCompare(b.properties.code);
    const sortFuncB = (a, b) => a.key.localeCompare(b.key);
    this.svg
      .selectAll("path")
      .data(d3.zip(this.map.features.sort(sortFuncA), this.data.sort(sortFuncB)), d => d[1].key)
      .join(
        (enter: any) => {enter
                          .append("path")
                            .attr("d", d => geoGenerator(d[0]))
                            .attr("stroke", "#000")
                            .attr("stroke-width", 1)
                            .attr("fill", d => this.setColor(d[1]))
                            .call((sel, i) => this.tooltip(sel, i))});
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

  tooltipHtml(d, i) {
    const map_features = d[0];
    const users_polarity = d[1];
    const prop = map_features.properties;
    const sigla = prop.code;
    const estado = prop.name;
    const semana = +this.week_selected.value;
    const n_coords = this.tweetCoords[semana-1][sigla];
    const n_locations = this.userLocations[semana-1][sigla];
    const fav = users_polarity.values[semana-1][0];
    const con = users_polarity.values[semana-1][1];

    return `
    <div style="display: flex; justify-content: flex-start; flex-flow: column;">
    <div style="align-self: center;">ESTATÍSTICAS</div>

      <div>${estado} - ${sigla}</div>
      <div>${semana}ª semana</div>
      <div>${n_coords} coordinates</div>
      <div>${n_locations} locations</div>
      <div>${fav} usuários à favor</div>
      <div>${con} usuários contra</div>
    </div>
    `;
  }

  tooltip(selection, i) {
    const tooltip = d3.select("#tooltip");
    selection
       .on("mouseover", (e, data) => {
          const t = d3.transition().duration(400).ease(d3.easeLinear);

          tooltip
          .html(d => this.tooltipHtml(data, i))
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
