import { Component, Input, OnInit } from '@angular/core';
import * as d3 from "d3";
import * as d3Scale from "d3-scale";
import * as d3Axis from "d3-axis";
import { DecimalPipe } from '@angular/common';
@Component({
  selector: 'app-lineplot',
  templateUrl: './lineplot.component.html',
  styleUrls: ['./lineplot.component.scss']
})
export class LineplotComponent implements OnInit {
  @Input()
  height;

  @Input()
  width;

  @Input()
  margin = {bottom: 30, top: 30, left: 40, right: 30};
  maxValue = 0;

  @Input()
  normalized = false;

  @Input()
  innerId: string;

  @Input()
  data: [number, number][][];

  @Input()
  legend: string[];

  constructor(private decimalPipe: DecimalPipe) { }

  ngOnInit() {
    setTimeout(() => this.plot(), 200);
  }

  plot(): void {
    const svg = d3.select(`#${this.innerId}`)
      .append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
      .append("g");

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
      .data(this.data)
      .join(enter => {
          const path = enter.append("path")
            .attr("fill", "none")
            .attr("stroke-width", 2)
            .attr("stroke", "black")
            .attr("d", d => f(d));

          const step = Math.floor((this.data[0].length-1)/5);

          enter.append("line")
            .attr("x1", (d, i) => hScale((d[(i + 1) * step][0])))
            .attr("y1", (d, i) => vScale((d[(i + 1) * step][1])))
            .attr("x2", (d, i) => hScale((d[(i + 1) * step][0])) + 20)
            .attr("y2", (d, i) => 40 + 30 * (i+1))
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
            .attr("x", (d, i) => hScale((d[(i + 1) * step][0])) + 20)
            .attr("y", (d, i) => 40 + 30 * (i+1))
            .html((d, i) => this.legend[i]);

      });

    const line = svg.append("line").attr("class", "guide");
    svg
    .on("mouseover", (event) => {
      this.drawGuide(line, event.offsetX, vScale, hScale);
    });
  }

  drawGuide(selection, x, vScale, hScale) {

  }

  magnitude(value) {
    let i = 1;
    while ((value / (Math.pow(10, i))) > 1)
      i += 1;

    const idx = Math.floor(i / 3);
    return (value / (Math.pow(10, 3 * idx))).toString() + ["", "k", "M", "B"][idx];
  }

}