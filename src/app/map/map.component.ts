import { ClassGetter } from '@angular/compiler/src/output/output_ast';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as d3 from "d3";
import * as d3Geo from "d3-geo";
import * as d3ToPng from 'd3-svg-to-png';
import { Margin } from '../types/margin';

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
  height = 900;
  width = 900;
  maxValue = 0;
  showingSmallMultiples = false;

  @Input()
  margin: Margin = {left: 30, right: 30, top: 30, bottom: 30};

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
        .attr("width", this.width)
        .attr("height", this.height)
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
      setTimeout(() => {this.plot(); this.plotWeek()}, 500);
    });

    this.weeks_no = d3.range(1, 36 + 1, 1);
    this.maxValue = d3.max(d3.merge(this.data.map(v => v.values)).map(tuple => Math.abs(tuple[0] - tuple[1])));
  }

  plot() {
    d3.select("#map").selectAll("*").remove();

    this.svg = d3.select("#map")
        .append("svg")
          .attr("width", this.width)
          .attr("height", this.height)
        .append("g")
          .attr("class", "standardMap");
  }

  plotWeek() {
    if (this.showingSmallMultiples)
      this.plot();


    const cuiaba = <[number, number]>[-15.595833, -56.096944];

    let projection = d3Geo.geoEquirectangular()
      .center(cuiaba)
      .fitExtent([
        [this.margin.left, this.margin.top],
        [this.width - this.margin.right, this.height - this.margin.bottom]
      ], this.map);

    let geoGenerator = d3Geo.geoPath().projection(projection);

    const sortFuncA = (a, b) => a.properties
                                 .code
                                 .localeCompare(b.properties.code);

    const sortFuncB = (a, b) => a.key.localeCompare(b.key);

    this.svg
      .selectAll("path")
      .data(
        d3.zip(this.map.features.sort(sortFuncA),
               this.data.sort(sortFuncB)), d => d[1].key)
      .join(enter =>
        enter.append("path")
          .attr("d", d => geoGenerator(d[0]))
          .attr("stroke", "#000")
          .attr("stroke-width", 1)
          .attr("fill", d => this.setColor(d[1]))
          .call((sel) => this.tooltip(sel)),
        update =>
          update.attr("fill", d => update.attr("fill"))
            .transition()
            .duration(3000)
            .ease(d3.easeLinear)
          .attr("fill", d => this.setColor(d[1])));
  }

  setColor(d: {key: string, values: [number, number][]}) {
    if (!this.maxValue) return 0;
    const week = +this.week_selected.value - 1;
    const polarity = d.values[week];
    const color = 0.5 * (polarity[0] - polarity[1])/this.maxValue;
    return d3.interpolateRdYlGn(0.5 + color);
  }

  setColorSmallMultiples(d: {key: string, values: [number, number][]}, week) {
    if (!this.maxValue)
      return 0;

    const polarity = d.values[week];
    const color = 0.5 * (polarity[0] - polarity[1])/this.maxValue;
    return d3.interpolateRdYlGn(0.5 + color);
  }

  plotSmallMultiples(selection, week, [centerX, centerY], [width, height] ) {
    this.showingSmallMultiples = true;

    const cuiaba: any = [-15.595833, -56.096944];

    let projection = d3Geo.geoEquirectangular()
      .center(cuiaba)
      .fitExtent([
        [centerX, centerY],
        [centerX + width, centerY + height]
      ], this.map);

    let geoGenerator = d3Geo.geoPath().projection(projection);

    selection
      .selectAll("path")
      .data(this.map.features)
      .join(enter =>
        enter.append("path")
        .attr("d", d => geoGenerator(d))
        .attr("stroke", "#000")
        .attr("stroke-width", 1)
        .attr("fill", (d, i) => this.setColorSmallMultiples(this.data[i], week)))
        .call((sel) => this.tooltip(sel, week))
  }

  smallMultiples() {
    this.svg.selectAll("*").remove();

    const selection = this.svg;

    const hScale = d3.scaleBand()
      .domain(d3.range(1, 6 + 1).map(v => v.toString()))
      .range([this.margin.left, this.width - this.margin.right])
      .paddingInner(0.1)
      .paddingOuter(0.1)
      .round(true);

    const hAxis = d3.axisTop(hScale);

    selection.append("g")
      .attr("class", "hAxis")
      .attr("transform", `translate(0, ${this.margin.top})`)
      .call(hAxis);

    const vScale = d3.scaleBand()
      .domain(d3.range(1, 6 + 1).reverse().map(v => v.toString()))
      .range([this.height - this.margin.bottom, this.margin.top])
      .paddingInner(0.1)
      .paddingOuter(0.1)
      .round(true);

    const vAxis = d3.axisLeft(vScale);

    selection.append("g")
      .attr("class", "vAxis")
      .attr("transform", `translate(${this.margin.left}, 0)`)
      .call(vAxis);


    for (let i of d3.range(1, 6 + 1).map(v => v.toString())) {
      for (let j of d3.range(1, 6 + 1).map(v => v.toString())) {
        let center = <[any, any]>[hScale(j), vScale(i)];
        let dimensions = <[any, any]>[hScale.bandwidth(), vScale.bandwidth()];
        this.plotSmallMultiples(selection.append("g"), (+i - 1) * 6 + (+j - 1), center, dimensions);
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
    let map_features = null;
    let users_polarity = null;
    let semana = null;

    if (i != null) {
      map_features = d;
      users_polarity = this.data.find(v => v.key === map_features.properties.code);
      semana = i;
    } else {
      map_features = d[0];
      users_polarity = d[1];
      semana = +this.week_selected.value - 1;
    }

    const prop = map_features.properties;
    const sigla = prop.code;
    const estado = prop.name;

    const n_coords = this.tweetCoords[semana][sigla];
    const n_locations = this.userLocations[semana][sigla];
    const fav = users_polarity.values[semana][0];
    const con = users_polarity.values[semana][1];

    return `
    <div style="display: flex; justify-content: flex-start; flex-flow: column;">
    <div style="align-self: center;">ESTATÍSTICAS</div>

      <div>${estado} - ${sigla}</div>
      <div>${semana + 1}ª semana</div>
      <div>${n_coords} coordinates</div>
      <div>${n_locations} locations</div>
      <div>${fav} usuários à favor</div>
      <div>${con} usuários contra</div>
    </div>
    `;
  }

  tooltip(selection, i = null) {
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
