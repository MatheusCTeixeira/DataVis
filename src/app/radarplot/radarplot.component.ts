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
  data: number[][] = [];

  median: number[] = [];
  mean: number[] = [];

  @Input() width = 500;
  @Input() height = 400;

  margin = {
    left: 30,
    right: 30,
    top: 30,
    bottom: 30
  }

  constructor() { }

  ngOnInit() {
    d3.csv("assets/daily_tweets.csv")
      .then(data => {
        for (let week of data) {
          week = week as any;
          let week_days = [];

          for (let day = 0; day < 7; ++day)
            if (+week[+day])
              week_days.push(+week[+day]);
            else
              week_days.push(NaN);

          const mean = d3.mean(week_days);
          const max = d3.max(week_days);

          week_days.forEach(v => v = Number.isNaN(v) ? mean : v);

          this.data.push(week_days.map(v => v/max));
        }

        this.median = d3.transpose(this.data).map((v: number[]) => d3.median(v));
        this.mean = d3.transpose(this.data).map((v: number[]) => d3.mean(v));
        this.draw();
      });
  }

  draw(): void {
    const PI = 3.14159265359;
    const CX = this.margin.left + (this.width - this.margin.left - this.margin.right)/2;
    const CY = this.margin.top + (this.height - this.margin.top - this.margin.bottom)/2;
    const RD = this.width/3;

    const svg = d3.select("#radar")
      .append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
      .append("g");

    svg
    .append("g")
    .selectAll("g")
    .data(d3.range(6))
    .join(
      enter => enter.append("g")
      .append("circle")
      .attr("fill", "none")
      .attr("stroke", "rgba(0, 0, 0, 0.7)")
      .attr("stroke-width", 1)
      .attr("cx", CX)
      .attr("cy", CY)
      .attr("r", (d, i) => i * RD/5));

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
        .attr("x2", (d, i) => RD * Math.sin(2* PI * i / this.data[0].length))
        .attr("y2", (d, i) => -RD * Math.cos(2* PI * i / this.data[0].length));

      return enter.append("text")
          .attr("fill", "black")
          .attr("dominant-baseline", "hanging")
          .attr("text-anchor", "middle")
          .attr("transform", (d, i) => `translate(${CX + 1.1 * RD * Math.sin(2* PI * i / 7)}, ${CY - 1.1 * RD * Math.cos(2* PI * i / 7)}) rotate(${360 * i / 7})`)
        .html((d, i) => this.header[i])

    });

    svg
    .append("g")
    .selectAll("g")
    .data(this.data)
    .join(enter =>
      enter
      .append("g")
      .attr("transform", `translate(${CX}, ${CY})`)
      .datum((d, i) => <any>d.map((v, i)=>[i, v]))
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "rgba(45, 45, 45, 0.2)")
      .attr("stroke-width", 1)
      .attr("d", d3.lineRadial().angle((d, i) => {
        return 2 * PI * i / 7;}).radius((d, i) => RD * d[1]).curve(d3.curveCardinalClosed)));

    svg
    .append("g")
    .selectAll("g")
    .data([this.mean, this.median] as number[][])
    .join(enter =>
      enter
      .append("g")
      .attr("transform", `translate(${CX}, ${CY})`)
      .datum((d, i) => <any>d.map((v, i)=>[i, v]))
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 2)
      .attr("d", d3.lineRadial().angle((d, i) => {
        return 2 * PI * i / 7;}).radius((d, i) => RD * d[1]).curve(d3.curveCardinalClosed)));
  }
}
