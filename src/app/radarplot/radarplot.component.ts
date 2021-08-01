import { Component, Input, OnInit } from '@angular/core';
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

  @Input() width;
  @Input() height;

  margin = 30;

  constructor() { }

  ngOnInit() {
    d3.csv("assets/daily_tweets.csv")
      .then(data => {
        for (let week of data) {
          week = week as any;
          let week_days = [];

          for (let day = 0; day < 7; ++day)
            if (+week[`_${day}`])
              week_days.push(+week[`_${day}`]);
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
    const CX = this.margin + (this.width - 2 * this.margin)/2;
    const CY = this.margin + (this.height - 2 * this.margin)/2;
    const RD = this.width/3;

    const sin = (i) => Math.sin(2* PI * i / 7);
    const cos = (i) => Math.cos(2* PI * i / 7);

    const svg = d3.select("#radar")
      .append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
      .append("g");

    const x = d3.scaleLinear()
      .domain([1, 0])
      .range([this.margin, CY]);

    const r = d3.scaleLinear()
      .domain([1, 0])
      .range([Math.abs(CY - this.margin), 0]);

    const axis = d3.axisRight(x);

    svg.append("g")
      .attr("transform", `translate(${CX}, 0)`)
      .call(axis);

    svg
    .append("g")
    .selectAll("g")
    .data(d3.range(0, 1.1, 0.1))
    .join(
      enter => enter.append("g")
      .append("circle")
      .attr("fill", "none")
      .attr("stroke", "rgba(0, 0, 0, 0.7)")
      .attr("stroke-width", 1)
      .attr("cx", CX)
      .attr("cy", CY)
      .attr("r", (d, i) => r(d)));

    svg
    .append("g")
    .selectAll("g")
    .data(d3.range(this.data[0].length))
    .join(enter => {
      enter.append("g")
      .append("line")
        .attr("fill", "none")
        .attr("stroke", "rgba(0, 0, 0, 1)")
        .attr("stroke-width", 1)
        .attr("transform", `translate(${CX}, ${CY})`)
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("y2", (d, i) => -r(1) * Math.cos(2* PI * i / 7))
        .attr("x2", (d, i) => r(1) * Math.sin(2* PI * i / 7));

      return enter.append("text")
          .attr("fill", "black")
          .attr("text-anchor", "middle")
          .attr("transform", (d, i) => `translate(${CX + r(1.05) * sin(i)}, ${CY - r(1.05) * cos(i)}) rotate(${360 * i / 7})`)
          .text((_, i) => this.header[i])

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
        return 2 * PI * i / 7;}).radius((d, i) => r(1) * d[1]).curve(d3.curveLinearClosed)))

    const factory = d3.lineRadial()
      .angle((d, i) => 2 * PI * i / 7)
      .radius((d, i) => RD * d[1])
      .curve(d3.curveCardinalClosed);

    const statistics = [this.mean, this.median];

    statistics.forEach(statistic => {
      svg.append("g")
        .attr("transform", `translate(${CX}, ${CY})`)
        .datum(statistic.map((v, i) => <[number, number]>[i, v]))
        .append("path")
          .attr("fill", "none")
          .attr("stroke", "red")
          .attr("stroke-width", 1.5)
          .attr("d", factory);

    })
  }



  highlight(selection, type) {
    const t = d3.transition().duration(300);
    if (type == "on") {
      selection
        .attr("stroke", "yellow");

    } else if (type == "off") {
      selection
      .attr("stroke", "black")
    }
  }
}
