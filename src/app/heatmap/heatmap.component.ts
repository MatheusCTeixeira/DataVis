import { DecimalPipe } from '@angular/common';
import { AfterContentInit, AfterViewChecked, Component, Input, OnInit } from '@angular/core';
import * as d3 from "d3";
import { Margin } from '../types/margin';

@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.scss']
})
export class HeatmapComponent implements OnInit {
  @Input()
  innerId: string;

  @Input()
  data: any[] = null;

  preprocessed_data: [number, [string, number, number][]][] = null;

  @Input()
  width;

  @Input()
  height;

  @Input()
  margin;

  @Input()
  show: boolean;

  // Used as a reference to animation
  previousScale = null;

  display: boolean = false;

  heatmapWidth = 800;
  heatmapGap = 15;
  heatmapScaleWidth = 30;

  constructor(private _decPipe: DecimalPipe) { }

  ngOnInit(): void {

  }

  ngOnChanges(changes: any) {
    const show = changes.show.currentValue;

    if (show === true)
      this.draw();
  }

  preprocess() {
    this.preprocessed_data = [];

    for (let row of this.data) {
      const features: [string, number, number][] = [];
      const group = +row.group;
      delete row.group;

      for (let cell in row) {
        features.push(<[string, number, number]>[cell, group, +row[cell]]);
      }

      this.preprocessed_data.push([group, features]);
    }
  }

  draw() {
    let X = Object.keys(this.data[0]).filter(key => key != "group");
    let Y = this.data.map(row => +row.group)

    const screenWidth = d3.select("#mainContent").style("width");

    const svg = d3.select(`#${this.innerId}`)
      .append("svg")
        .attr("width", screenWidth)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("viewBox", `0 0 ${this.width} ${this.height}`)
      .append("g");

    this.preprocess();

    const content = svg
        .append("g")
        .attr("class", "content");

    const [scaleH, scaleV] = this.drawAxes(svg, content, X, Y);
    this.genBlocks(content, scaleH, scaleV);

    this.drawScaler(svg);
    this.display = true;
  }

  drawScaler(selection) {
    const gradient = selection
      .append("defs")
      .append("linearGradient")
        .attr("gradientTransform", "rotate(90)")
        .attr("id", "scaleGrad");

    gradient
      .selectAll("stop")
      .data(d3.ticks(0, 1, 50))
      .join(enter => enter.append("stop")
        .attr("offset", d => `${100*d}%`)
        .attr("stop-color", d => d3.interpolateInferno(1-d)));

    const group = selection.append("g");

    group
        .attr("class", "colorScale")
        .attr("transform", `translate(${this.margin.left + this.heatmapWidth + this.heatmapGap}, ${this.margin.top})`)
      .append("rect")
        .attr("width", this.heatmapScaleWidth)
        .attr("height", this.heatmapWidth)
        .attr("fill", "url(#scaleGrad)");

    // Ativa o brush
    group.call(d3.brushY()
      .extent([[0, 0], [this.heatmapScaleWidth, this.heatmapWidth]])
      .on("end", (e)=> this.highlight(selection, e)));

    const offsetX = this.heatmapScaleWidth;
    const ticks = d3.ticks(0, 1, 20);
    // Desenha os ticks
    group.selectAll("text")
      .data(ticks)
      .join(enter => {enter.append("text")
          .text(d => this._decPipe.transform(d, "1.2-2"))
          .attr("x", offsetX + 3)
          .attr("y", d => (1-d) * this.heatmapWidth)
          .attr("dominant-baseline", "middle")
          .attr("font-size", 11)
          .attr("fill", "#000")
       return enter.append("line")
          .attr("x1", offsetX - this.heatmapScaleWidth/3)
          .attr("x2", offsetX + 3)
          .attr("y1", d => (1-d) * this.heatmapWidth)
          .attr("y2", d => (1-d) * this.heatmapWidth)
          .attr("stroke", "#000")
          .attr("stroke-width", 1)});
  }

  drawAxes(svg, content, X: any[], Y: any[]) {
    const hRange = [this.margin.left, this.margin.left + this.heatmapWidth];
    const scaleH = d3.scaleBand(X, hRange).round(true);
    const axisTop = d3.axisTop(scaleH);

    svg.append("g")
        .attr("class", "axisX")
        .attr("transform", `translate(${0}, ${this.margin.top})`)
        .call(axisTop)
      .selectAll("text")
        .attr("class", "ticks")
        .attr("dominant-baseline", "hanging")
        .attr("text-anchor", "start")
        .attr("transform", "translate(5, -10) rotate(-60)")
        .style("cursor", "pointer")
        .on("click", d => {
          const feature = d3.select(d.srcElement).html();
          this.sortByFeature(feature);

          this.previousScale = scaleV;
          Y = this.preprocessed_data.map(row => row[0])
          const vRange = [this.margin.top, this.margin.top + this.heatmapWidth];

          const newScaleV = d3.scaleBand(Y, vRange).round(true);
          const axisLeft = this.nTicks(d3.axisLeft(newScaleV), Y, 15);

          svg.select("g.axisV").call(axisLeft);

          this.genBlocks(content, scaleH, newScaleV, this.previousScale);
        });

    const vRange = [this.margin.top, this.margin.top + 800];
    const scaleV = d3.scaleBand(Y, vRange).round(true);
    const axisLeft = this.nTicks(d3.axisLeft(scaleV), Y, 15);

    svg.append("g")
      .attr("class", "axisV")
      .attr("transform", `translate(${this.margin.left}, ${0})`)
      .call(axisLeft);

      console.log("scale", scaleH.bandwidth(), scaleV.bandwidth());
    return [scaleH, scaleV];
  }

  private nTicks(axis: d3.Axis<any>, domain: number[], n: number) {
    const step = Math.round(domain.length / n);
    axis.tickValues(domain.filter((_, i) => i % step == 0));
    return axis;
  }

  private sortByFeature(feature: string) {
    const feature_idx = this.preprocessed_data[0][1]
            .findIndex(v => v[0] === feature);

    this.preprocessed_data = this.preprocessed_data.sort(function (l,r) {
      const lGroup = l[1][feature_idx][2];
      const rGroup = r[1][feature_idx][2];
      return rGroup - lGroup;
    });
  }



  genBlocks(selection, scaleX: any, scaleY: any, previousScaleY: any = null, threshold: [number, number]=null) {
    const t = d3.transition().duration(750).ease(d3.easeLinear);

    selection
      .selectAll("g.row")
      .data(this.preprocessed_data, d => d[0]) // key é o id do grupo, ie, a row
      .join(
        enter => enter
            .append("g")
              .attr("class", "row")
            .selectAll("rect")
            .data((d:[number, [string, number, number][]]) => d[1])
            .join(enter => enter.append("rect")
              .attr("x", d => scaleX(d[0]))
              .attr("y", d => scaleY(d[1]))
              .attr("width", scaleX.bandwidth())
              .attr("height", scaleY.bandwidth())
              .attr("shape-rendering", "crispEdges")
              .attr("fill", (d, i) => d3.interpolateInferno(+d[2]))),
        update => update
              .attr("transform", d => "translate(0, 0)")
            .transition(t)
              .attr("transform", d => `translate(0, ${scaleY(d[0]) - previousScaleY(d[0])})`)
      );
  }

  highlight(selection, e) {
    let threshold: [number, number];
    if (!e.selection) {
      threshold = [-1, 1];
    } else {
      threshold = e.selection
      .map(v => (this.heatmapWidth - v)/ this.heatmapWidth)
      .sort();
    }

    const between = (x) => threshold[0] <= x && x <= threshold[1];

    selection
      .selectAll("g.row")
      .data(this.preprocessed_data, d => d[0]) // key é o id do grupo, ie, a row
      .join(null,
        update => update
        .selectAll("rect")
        .data((d:[number, [string, number, number][]]) => d[1])
        .join(null,
          update => update.attr("fill", function (d) {
            const x = d[2];
            return between(x) ? d3.interpolateInferno(+d[2]) : "black";
          })));
  }
}
