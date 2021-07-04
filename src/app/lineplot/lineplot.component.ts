import { Component, Input, OnInit } from '@angular/core';
import * as d3 from "d3";
import * as d3Scale from "d3-scale";
import * as d3Axis from "d3-axis";
@Component({
  selector: 'app-lineplot',
  templateUrl: './lineplot.component.html',
  styleUrls: ['./lineplot.component.scss']
})
export class LineplotComponent implements OnInit {
  height = 300;
  width = 450;
  margin = {bottom: 30, top: 30, left: 30, right: 30};

  @Input()
  data: [number, number][] = [
    [1,29],
    [2,13],
    [3,12],
    [4,7],
    [5,55],
    [6,9],
    [7,10],
    [8,15],
    [9,13],
    [10,7],
    [11,17],
    [12,28],
    [13,9],
  ];

  constructor() { }

  ngOnInit(): void {
    const svg = d3.select("#line")
      .append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
      .append("g");

    const scaleX = d3Scale.scaleLinear()
      .domain([0, 13])
      .range([0, this.width - this.margin.left - this.margin.right]);

    const axisX = d3Axis.axisBottom(scaleX);

    svg.append("g")
      .attr("transform", `translate(${this.margin.left}, ${this.height-this.margin.bottom})`)
      .call(axisX);

    const scaleY = d3Scale.scaleLinear()
      .domain([0, 60])
      .range([this.height - this.margin.bottom - this.margin.top, 0]);

    const axisY = d3Axis.axisLeft(scaleY);

    svg.append("g")
      .attr("transform", `translate(${this.margin.left}, ${this.margin.bottom})`)
      .call(axisY);

    svg.append("g")
      .append("path")
        .attr("fill", "none")
        .attr("stroke", "black")
      .datum(this.data)
      .attr("d", d3.line().x(d=>scaleX(d[0])+this.margin.right).y(d=>scaleY(d[1])+this.margin.bottom));

  }


}
