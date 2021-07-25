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
  height = 300;
  width = 450;

  margin = {bottom: 30, top: 30, left: 40, right: 30};
  maxValue = 0;

  @Input()
  normalized = false;

  @Input()
  innerId: string;

  data_b =  new Map<string, [number, number][]>();

  constructor(private decimalPipe: DecimalPipe) { }

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

    const hScale = d3Scale.scaleLinear()
      .domain([1, 36])
      .range([this.margin.left, this.width]);

    const axisX = d3.axisBottom(hScale);

    svg.append("g")
      .attr("transform", `translate(0, ${this.height-this.margin.bottom})`)
      .call(axisX);

    const vScale = d3Scale.scaleLinear()
      .domain([0, this.maxValue])
      .range([this.height - this.margin.top, this.margin.bottom]);

    const axisY = d3.axisLeft(vScale)
      .tickFormat((v: number) => `${this.normalized ? v : Math.round(v/10000)/100}`);

    svg.append("g")
      .attr("transform", `translate(${this.margin.left}, 0)`)
      .call(axisY);


    const color = {
      "con": "red",
      "fav": "green",
      "bot": "gray",
      "con_norm": "red",
      "fav_norm": "green",
      "bot_norm": "gray"
    };

    const f = d3.line()
      .x(d=>hScale(d[0]))
      .y(d=>vScale(d[1]))
      .curve(d3.curveBasisOpen);

    svg
    .append("g")
      .selectAll("path")
      .data(Array.from(this.data_b.entries()))
      .join("path")
        .attr("fill", "none")
        .attr("stroke-width", 4)
        .attr("stroke", d => color[d[0]])
      .datum((d: any) => d[1])
      .attr("d", f);

    const line = svg.append("line").attr("class", "guide");
    svg
    .on("click", (event) => {
      this.drawGuide(line, event.offsetX, vScale, hScale);
    });
  }

  drawGuide(selection, x, vScale, hScale) {
    selection
      .attr("x1", x)
      .attr("y1", vScale(0))
      .attr("x2", x)
      .attr("y2", hScale(15))
      .attr("stroke", "black")
      .attr("stroke-width", 1)

  }


}
