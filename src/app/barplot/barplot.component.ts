import { Component, OnInit } from '@angular/core';
import * as d3 from "d3";
import * as d3Axis from "d3-axis";
import * as d3Scale from "d3-scale";
import * as d3Transition from "d3-transition";

interface IData {
  week_no: number;
  m: number;
  f: number;
  unknown: number;
};

@Component({
  selector: 'app-barplot',
  templateUrl: './barplot.component.html',
  styleUrls: ['./barplot.component.scss']
})
export class BarplotComponent implements OnInit {
constructor() { }

  margin = ({top: 30, right: 10, bottom: 30, left: 60});
  height = 400
  width = 900

  ngOnInit(): void {
    d3.csv("assets/sex_weeks.csv")
    .then((data: any) => this.plot(data as IData[]));
  }

  plot(data: IData[]) {
    const marginX = this.margin.left + this.margin.right;
    const marginY = this.margin.top + this.margin.bottom;


    const svg = d3.select("#bar")
      .append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
      .append("g");


    const hScale = d3.scaleLinear()
                    .domain([0, 37])
                    .range([this.margin.left, this.width - this.margin.right]);

    const hAxis = d3.axisBottom(hScale).ticks(15);

    const vScale = d3.scaleLinear()
        .domain([0, d3.max(data.map(v => 1.1 * (+v.f + +v.m + +v.unknown)))])
        .range([this.height - this.margin.bottom, this.margin.top]);

    const vAxis = d3.axisLeft(vScale);

    svg
      .append("g")
        .attr("transform", `translate(0, ${this.height - this.margin.bottom})`)
        .call(hAxis);

    svg.append("g")
      .attr("transform", `translate(${this.margin.left}, ${0})`).call(vAxis);

    svg
      .append("g")
      .selectAll("rect")
      .data(data)
      .join(
        enter => {
          const t = d3.transition().duration(500).ease(d3.easeSinInOut);

          enter.append("rect")
          .attr("fill", "#0000ff")
          .attr("x", d => hScale(d.week_no)- 8)
          .attr("y", d => vScale(d.m))
          .attr("width", 16)
          .attr("height", 0)
          .attr("fill", "#fff")
          .transition(t)
            .attr("fill", "#0000ff")
            .attr("height", d => vScale(0) - vScale(d.m));

          enter.append("rect")
          .attr("x", d => hScale(d.week_no) - 8)
          .attr("y", d => vScale(d.m) - (vScale(0) - vScale(d.f)))
          .attr("width", 16)
          .attr("height", 0)
          .attr("fill", "#fff")
          .transition(t)
            .attr("fill", "#ff0000")
            .attr("height", d => vScale(0) - vScale(d.f));

          enter.append("rect")
          .attr("fill", "#a9a9bd")
          .attr("x", d => hScale(d.week_no) - 8)
          .attr("y", d => vScale(+d.f + +d.m) - (vScale(0) - vScale(d.unknown)))
          .attr("width", 16)
          .attr("height", 0)
          .attr("fill", "#fff")
          .transition(t)
            .attr("fill", "#a9a9bd")
            .attr("height", d => vScale(0) - vScale(d.unknown));

          return null;
        });
  }

}