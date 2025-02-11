import { Component, Input, OnInit } from '@angular/core';
import * as d3 from "d3";
import * as d3Scale from "d3-scale";
import * as d3Axis from "d3-axis";
import { DecimalPipe } from '@angular/common';
import { Dimension } from '../types/dimension';
@Component({
  selector: 'app-lineplot',
  templateUrl: './lineplot.component.html',
  styleUrls: ['./lineplot.component.scss', '../tooltip.scss']
})
export class LineplotComponent implements OnInit {
  @Input()
  height;

  @Input()
  _width;

  @Input()
  width;

  @Input()
  margin;
  maxValue = 0;

  @Input()
  normalized = false;

  @Input()
  innerId: string;

  @Input()
  data: [number, number][][];

  @Input()
  _title: string;

  @Input()
  xLabel: string;

  @Input()
  yLabel: string;

  @Input()
  legend: string[];

  @Input()
  color: string[]

  @Input()
  show: boolean = false;

  display: boolean = false;

  constructor(private _decPipe: DecimalPipe) { }

  ngOnInit() {
  }

  ngOnChanges(changes) {
    const show = changes.show?.currentValue;

    if (show === true)
      this.draw();
  }

  draw(): void {
    const svg = d3.select(`#${this.innerId}`)
      .append("svg")
        .attr("width", this._width)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("viewBox", `0 0 ${this.width} ${this.height}`)
        .classed(this.innerId, true)
      .append("g")
      .on("mouseover", () => null);

    const hScale = d3Scale.scaleLinear()
      .domain([1, 36])
      .range([this.margin.left, this.width - this.margin.right]);

    const axisX = d3.axisBottom(hScale);

    svg.append("g")
      .attr("transform", `translate(0, ${this.height-this.margin.bottom})`)
      .call(axisX);

    this.maxValue = d3.max(<number[]>d3.merge(this.data.map(row => row.map(d => d[1]))));
    const vScale = d3Scale.scaleLinear()
      .domain([0, 1.2 * this.maxValue])
      .range([this.height - this.margin.top, this.margin.bottom]);

    const axisY = d3.axisLeft(vScale).tickFormat(d => this.magnitude(d));

    svg.append("g")
      .attr("transform", `translate(${this.margin.left}, 0)`)
      .call(axisY);

    const f = d3.line()
      .x(d=>hScale(d[0]))
      .y(d=>vScale(d[1]))

    svg
    .append("g")
      .selectAll("path")
      .data(this.data.map(d => d), (_, i) => i)
      .join(enter => {
          const path = enter.append("path")
            .attr("fill", "none")
            .attr("stroke-width", 2)
            .attr("stroke", (_, i) => this.color[i])
            .attr("d", d => f(d));

          const step = Math.floor((this.data[0].length-1)/5);

          enter.append("line")
            .attr("x1", (d, i) => hScale((d[(i + 1) * step][0])))
            .attr("y1", (d, i) => vScale((d[(i + 1) * step][1])))
            .attr("x2", (d, i) => hScale((d[(i + 1) * step][0])) + 20)
            .attr("y2", (_, i) => 40 + 30 * (i+1))
            .attr("stroke", "black")
            .attr("stroke-dasharray", "2  2")
            .attr("stroke-width", 1);

          var totalLength = path.node().getTotalLength();

          path
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
              .duration(5000)
              .ease(d3.easeLinear)
              .attr("stroke-dashoffset", 0);

          return enter.append("text")
            .text((_, i) => this.legend[i])
            .attr("x", (d, i) => hScale((d[(i + 1) * step][0])) + 20)
            .attr("y", (_, i) => 40 + 30 * (i+1))
            .attr("text-anchor", "middle")
            .style("fill", (_, i) => this.color[i])

      });

      this.addLegend(svg);
      this.addXLabel(svg);
      this.addYLabel(svg);
      this.addValueIndicator(svg, vScale, hScale);

      this.display = true;
  }

  addLegend(selection) {
    selection.append("text")
      .classed("title", true)
      .text(this._title)
      .attr("x", this.width/2)
      .attr("y", this.margin.top/2)
      .attr("text-anchor", "middle");
  }

  addValueIndicator(selection, vScale, hScale) {
    const line = selection.append("g").append("line")
        .attr("x1", 0)
        .attr("x2", 0)
        .attr("y1", vScale(0))
        .attr("y2", vScale(1.2 * this.maxValue))
        .attr("stroke", "black")
        .attr("stroke-dasharray", 10 + " " + 2)
        .attr("stroke-width", 2)
        .style("visibility", "hidden");

    const labels = selection.append("g")
      .classed("text", true)
      .append("text");

    const self = this;

    selection.append("rect")
        .attr("x", this.margin.left)
        .attr("y", vScale(1.2 * this.maxValue))
        .attr("width", hScale(36) - hScale(1) - 20)
        .attr("height", vScale(0) - vScale(1.2 * this.maxValue))
        .attr("fill", "transparent")
        .on("mouseover", function(e, data) {
          self.tooltip(d3.select(this), labels, line, hScale, vScale);
        })
  }

  addXLabel(selection) {
    selection.append("text")
      .text(this.xLabel)
      .attr("x", this.width/2)
      .attr("y", this.height - this.margin.bottom / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "hanging");
  }

  addYLabel(selection) {
    selection.append("text")
      .text(this.yLabel)
      .attr("transform", `translate(${0}, ${this.height/2}) rotate(-90)`)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "hanging");
  }

  magnitude(value) {
    let i = 1;
    while ((value / (Math.pow(10, i))) > 1)
      i += 1;

    const idx = Math.floor(i / 3);
    return (value / (Math.pow(10, 3 * idx))).toString() + ["", "k", "M", "B"][idx];
  }

  tooltipHtml(colors, legends, week, values) {
    const fmt = (x) => this._decPipe.transform(x ?? 0, '1.2-2');

    let html = `<div>
    <div style="width: 100%; text-align: center;"><b>ESTATÍSTICAS</b></div>
    <div>${week}ª semana</div>`;

      for (let [index, v] of d3.zip(colors, legends, values).sort((l, r) => +r[2] - +l[2]).entries())
        html += `
          <div>
            <span style='display: inline-block;padding: 0px 2px; margin: 1px;background-color: ${v[0]};'>${index+1}º</span>
            ${v[1]}: ${fmt(v[2])}
        </div>`;

    html += "</div>"

    return html;
  }

  tooltip(selection, svg, line, hScale, vScale) {
    const tooltip = d3.select("#tooltip");
    selection
      .on("mouseover", function() {
        tooltip.style("visibility", "visible");
        line.style("visibility", "visible");
      })
      .on("mousemove", e => {

        const week = Math.round(hScale.invert(e.offsetX));
        const values = this.data
          .map(serie => serie.filter(d => d[0] === week)[0])
          .map(v => v[1]);

        tooltip
          .html(this.tooltipHtml(this.color, this.legend, week, values))
          .style("left", e.pageX + 20 + "px")
          .style("top", e.pageY + "px")
          .style("visibility", "visible")
          .style("opacity", 1);

        line.attr("x1", e.offsetX)
            .attr("x2", e.offsetX)
            .style("visibility", "visible")
            .style("opacity", 1);
      }
      )
      .on("mouseout", function() {
        tooltip.style("visibility", "hidden");
        line.style("visibility", "hidden");
      });
  }

}