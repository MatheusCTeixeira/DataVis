import { DatePipe, DecimalPipe } from '@angular/common';
import { ClassGetter } from '@angular/compiler/src/output/output_ast';
import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import * as d3 from "d3";
import * as d3Geo from "d3-geo";
import * as d3ToPng from 'd3-svg-to-png';
import { Margin } from '../types/margin';
import { Polarities } from '../types/polaritiries';

const p2 = x => Math.pow(x, 2);
const r2 = x => Math.sqrt(x);

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
  margin: Margin = { left: 30, right: 30, top: 30, bottom: 30 };

  @Input()
  data: Polarities[];

  @Input()
  tweetCoords;

  @Input()
  userLocations;

  constructor(
    private datePipe: DatePipe,
    private decPipe: DecimalPipe) { }

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
      setTimeout(() => { this.smallMultiples() }, 500);
    });

    this.weeks_no = d3.range(1, 36 + 1, 1);
    this.maxValue = d3.max(this.data.map(v => d3.max(Object.values(v).map(v => Math.abs(v[0] - v[1])))).map(v => v));
  }

  plotWeek(week: number) {
    d3.select("#map").selectAll("*").remove();

    this.svg = d3.select("#map")
      .append("svg")
      .attr("width", this.width)
      .attr("height", this.height)
      .append("g")
      .attr("class", "standardMap");

    const cuiaba = <[number, number]>[-15.595833, -56.096944];

    // Contruct the projection callback
    let projection = d3Geo.geoEquirectangular()
      .center(cuiaba)
      .fitExtent([
        [this.margin.left, this.margin.top],
        [this.width - this.margin.right, this.height - this.margin.bottom]
      ], this.map);

    let geoGenerator = d3Geo.geoPath().projection(projection);

    // Plot main content, ie, the map
    this.svg
      .selectAll("path")
      .data(this.map.features)
      .join(enter =>
        enter.append("path")
          .attr("d", d => geoGenerator(d))
          .attr("stroke", "#000")
          .attr("stroke-width", 1)
          .attr("fill", d => this.setColor(d.properties.code, this.data[week]))
          .call((sel) => this.tooltip(sel, week, "weekly")));

    // Plot return label
    this.addReturnButton(this.svg);

    // Plot title
    this.addTitle(week);
  }

  private addReturnButton(selection) {
      const group = selection.append("g");

      group.append("text")
        .text("Voltar")
        .attr("x", 15)
        .attr("y", 25)
        .attr("dominant-baseline", "middle")
        .style("font-size", 15)
        .style("fill", "red")
        .style("cursor", "pointer");

        group
        .each(function() {
          const dim = this.getBBox();
          console.log(dim);
          group.insert("rect", "text")
            .attr("x", dim.x - 5)
            .attr("y", dim.y - 5)
            .attr("width", dim.width + 10)
            .attr("height", dim.height + 10)
            .attr("fill", "rgba(241, 16, 9, 0.2)")
            .attr("stroke", "rgba(247, 13, 4, 0.877)")
            .attr("stroke-width", 1);
        })
      .on("click", () => this.smallMultiples());
  }

  private addTitle(week: number) {
    let base = new Date(2020, 4, 26);
    const from = base.setDate(base.getDate() + 7 * week);
    base = new Date(2020, 4, 26);
    const to = base.setDate(base.getDate() + 7 * (week + 1));
    const fromAsString = this.datePipe.transform(from, 'dd/MM');
    const toAsString = this.datePipe.transform(to, 'dd/MM');
    this.svg.append("text")
      .text(`${fromAsString} ─ ${toAsString}`)
      .attr("x", this.width / 2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("font-size", 20);
  }

  setColor(state, polarities: Polarities) {
    if (!this.maxValue) return 0;
    const color = 0.5 * (polarities[state][0] - polarities[state][1]) / this.maxValue;
    return d3.interpolateRdYlGn(0.5 + color);
  }

  setColorSmallMultiples(d: { key: string, values: [number, number][] }, week) {
    if (!this.maxValue)
      return 0;

    const polarity = d.values[week];
    const color = 0.5 * (polarity[0] - polarity[1]) / this.maxValue;
    return d3.interpolateRdYlGn(0.5 + color);
  }

  plotSmallMultiples(selection, week, [x, y], [width, height]) {
    this.showingSmallMultiples = true;

    const cuiaba: any = [-15.595833, -56.096944];

    let projection = d3Geo.geoEquirectangular()
      .center(cuiaba)
      .fitExtent([
        [x, y],
        [x + width, y + height]
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
          .attr("fill", (d, i) => this.setColor(d.properties.code, this.data[week])))
      .call((sel) => this.tooltip(sel, week, "summarized"))
      .on("click", (e) => this.plotWeek(week));

    const label = selection.append("g");

    label.append("text")
      .text(week + 1)
      .attr("x", x + (2.5/10) * width)
      .attr("y", y + (5/7) * height)
      .attr("font-height", 10)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .each(function() {
        const dim = this.getBBox();

        label.insert("circle", "text")
          .attr("cx", dim.x + dim.width/2)
          .attr("cy", dim.y + dim.height/2)
          .attr("r", 3/5*r2(p2(dim.width) + p2(dim.height)))
          .attr("fill", "rgb(255, 255, 0)")
          .attr("stroke", "#000")
          .attr("stroke-width", 1);
      })
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
      .style("visibility", "hidden")
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
      .style("visibility", "hidden")
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
    d3ToPng.default("#map svg", "map.jpg", { quality: 100 })
      .then(res => {
        console.log(res);
      })
  }

  tooltipHtmlForWeekly(map_features, week) {
    const transform = (v) => this.decPipe.transform(v, "1.0-0");
    const prop = map_features.properties;
    const code = prop.code;
    const state = prop.name;
    const n_coords = transform(this.tweetCoords[week][code]);
    const n_locations = transform(this.userLocations[week][code]);
    const fav = transform(this.data[week][code][0]);
    const con = transform(this.data[week][code][1]);

    return `
    <div style="display: flex; justify-content: flex-start; flex-flow: column;">
    <div style="align-self: center;">ESTATÍSTICAS</div>

      <div>${state} - ${code}</div>
      <div>${week + 1}ª semana</div>
      <div>${n_coords} coordinates</div>
      <div>${n_locations} locations</div>
      <div>${fav} usuários à favor</div>
      <div>${con} usuários contra</div>
    </div>
    `;
  }

  tooltipHtmlForSmallMultiples(week) {
    const transform = (v) => this.decPipe.transform(v, "1.0-0");

    const n_coords = d3.sum(<number[]>Object.values(this.tweetCoords[week]));

    const n_locations = d3.sum(<number[]>Object.values(this.userLocations[week]));
    const fav = d3.sum(<number[]>Object.values(this.data[week]).map(v => v[0]));
    const con = d3.sum(<number[]>Object.values(this.data[week]).map(v => v[1]));

    return `
    <div style="display: flex; justify-content: flex-start; flex-flow: column;">
    <div style="align-self: center;">ESTATÍSTICAS</div>
      <div>${week + 1}ª semana</div>
      <div>${transform(n_coords)} coordinates</div>
      <div>${transform(n_locations)} locations</div>
      <div>${transform(fav)} usuários à favor</div>
      <div>${transform(con)} usuários contra</div>
    </div>
    `;
  }

  tooltip(selection, week, mode: string) {
    const tooltip = d3.select("#tooltip");
    selection
      .on("mouseover", (_, data) =>
        tooltip
          .html(() => mode === "weekly" ? this.tooltipHtmlForWeekly(data, week) : this.tooltipHtmlForSmallMultiples(week))
          .style("visibility", "visible")
          .style("opacity", 0)
          .transition()
            .duration(400)
            .ease(d3.easeLinear)
          .style("opacity", 1)
      )
      .on("mousemove", e =>
        tooltip
          .style("visibility", "visible")
          .style("left", e.pageX + 20 + "px")
          .style("top", e.pageY + "px")
      )
      .on("mouseout", () =>
        tooltip
          .style("opacity", 1)
          .transition()
            .duration(400)
            .ease(d3.easeLinear)
          .style("opacity", 0)
          .style("visibility", "hidden")
      );
  }
}
