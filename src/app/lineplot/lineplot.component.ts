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
  maxValue = 0;

  @Input()
  normalized = false;

  @Input()
  innerId: string;

  data_b =  new Map<string, [number, number][]>();

  constructor() { }

  ngOnInit() {
    d3.csv("assets/tweets.csv")
      .then(data => {
        for (let row of data) {
          for (const key of Object.keys(row)) {
            if (key == "week" || (this.normalized && !key.includes("norm")))
              continue

            if (!this.data_b.has(key))
              this.data_b.set(key, []);

            this.data_b.get(key).push([+row["week"], +row[key]] as [number, number]);

            if (+row[key] > this.maxValue)
              this.maxValue = +row[key];
          }
        }
        this.plot();
      })
  }

  plot(): void {
    const svg = d3.select(`#${this.innerId}`)
      .append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
      .append("g");

    const scaleX = d3Scale.scaleLinear()
      .domain([1, 36])
      .range([0, this.width - this.margin.left - this.margin.right]);

    const axisX = d3Axis.axisBottom(scaleX);

    svg.append("g")
      .attr("transform", `translate(${this.margin.left}, ${this.height-this.margin.bottom})`)
      .call(axisX);

    const scaleY = d3Scale.scaleLinear()
      .domain([0, this.maxValue])
      .range([this.height - this.margin.bottom - this.margin.top, 0]);

    const axisY = d3Axis.axisLeft(scaleY);

    svg.append("g")
      .attr("transform", `translate(${this.margin.left}, ${this.margin.bottom})`)
      .call(axisY);

    const color = {
      "con": "red",
      "fav": "green",
      "bot": "gray",
      "con_norm": "red",
      "fav_norm": "green",
      "bot_norm": "gray"
    };

    svg
    .append("g")
      .selectAll("path")
      .data(this.data_b)
      .join("path")
        .attr("fill", "none")
        .attr("stroke", d => color[d[0]])
      .datum((d: any) => {console.log("any", d[1]); return d[1];})
      .attr("d", d3.line().x(d=>scaleX(d[0])+this.margin.right).y(d=>scaleY(d[1])+this.margin.bottom).curve(d3.curveBasisOpen));

  }


}
