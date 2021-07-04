import { Component, Input, OnInit } from '@angular/core';
import * as d3Axis from "d3-axis";
import * as d3Scale from "d3-scale";
import * as d3 from "d3";

@Component({
  selector: 'app-radarplot',
  templateUrl: './radarplot.component.html',
  styleUrls: ['./radarplot.component.scss']
})
export class RadarplotComponent implements OnInit {
  @Input()
  header: string[] = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

  @Input()
  data: number[][] = [
    [5,16,8,10,12,13,8],
    [2,18,2,11,6,9,0],
    [14,20,4,7,6,11,10],
    [8,9,2,11,7,12,3],
    [5,6,7,11,8,3,5],
  ]

  @Input() width = 800;
  @Input() height = 800;

  margin = {
    left: 30,
    right: 30,
    top: 30,
    bottom: 30
  }

  constructor() { }

  ngOnInit(): void {
    const PI = 3.14159265359;
    const CX = this.margin.left + (this.width - this.margin.left - this.margin.right)/2;
    const CY = this.margin.top + (this.height - this.margin.top - this.margin.bottom)/2;
    const RD = this.width/3;

    const svg = d3.select("#radar")
      .append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
        .attr("viewBox", "0 0 1000 1000")
      .append("g");

    svg
    .append("g")
    .selectAll("g")
    .data(d3.range(this.data.length))
    .join(
      enter => enter.append("g")
      .append("circle")
      .attr("fill", "none")
      .attr("stroke", "rgba(0, 0, 0, 0.3)")
      .attr("stroke-width", 1)
      .attr("cx", CX)
      .attr("cy", CY)
      .attr("r", (d, i) => i * RD/this.data.length));

    svg
    .append("g")
    .selectAll("g")
    .data(d3.range(this.data[0].length))
    .join(enter => {
      enter.append("g")
      .append("line")
      .attr("fill", "none")
      .attr("stroke", "rgba(0, 0, 0, 0.3)")
      .attr("stroke-width", 1)
      .attr("transform", `translate(${CX}, ${CY})`)
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => RD * Math.cos(2* PI * i / this.data[0].length))
      .attr("y2", (d, i) => RD * Math.sin(2* PI * i / this.data[0].length))

      enter.append("text")
      .attr("fill", "black")
      .attr("transform", (d, i) => `translate(${CX + RD * Math.cos(2* PI * i / this.data[0].length)}, ${CY + RD * Math.sin(2* PI * i / this.data[0].length)})`)
      .html((d, i) => this.header[i])

      return null;
    });

    svg
    .append("g")
    .selectAll("g")
    .data(this.data)
    .join(enter =>
      enter
      .append("g")
      .attr("transform", `translate(${CX}, ${CY})`)
      .datum(d => this.random(7))
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("d", d3.lineRadial().angle((d, i) => 2 * PI * i/7).radius((d, i) => d[1]).curve(d3.curveCatmullRomClosed)));



  }

  random(n) {
    let arr = [];
    for (let i = 0; i < n; ++i)
      arr.push([i, Math.random() * 40 + 200])

    // arr.push(arr[0]);

    return arr;
  }
}
