import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import * as d3 from "d3";
import { ScaleLinear } from 'd3';
import { Margin } from '../types/margin';
import { DecimalPipe } from "@angular/common";

@Component({
  selector: 'app-boxplot',
  templateUrl: './boxplot.component.html',
  styleUrls: ['./boxplot.component.scss']
})
export class BoxplotComponent implements OnInit, AfterViewInit {

  @Input()
  innerId: string;

  // @Input()
  // data: {label: string, data: [number, number[]][]}[];

  mock: {label: string, style: {boxColor?: any},data: [number, number[]][]}[] = [
    {
      label: "car",
      style: {
        boxColor: "red",
      },
      data: [[10, this.rand(7, 17, 2, 50)],
             [20, this.rand(7, 17, 2, 50)],
             [30, this.rand(7, 17, 2, 50)],
             [40, this.rand(7, 17, 2, 50)],
             [50, this.rand(7, 17, 2, 50)],
             [60, this.rand(7, 17, 2, 50)],
             [70, this.rand(7, 17, 2, 50)],
             [80, this.rand(7, 17, 2, 50)],
      ]
    },
    {
      label: "car",
      style: {
        boxColor: "blue",
      },
      data: [[10, this.rand(7, 17, 2, 50)],
             [20, this.rand(7, 17, 2, 50)],
             [30, this.rand(7, 17, 2, 50)],
             [40, this.rand(7, 17, 2, 50)],
             [50, this.rand(7, 17, 2, 50)],
             [60, this.rand(7, 17, 2, 50)],
             [70, this.rand(7, 17, 2, 50)],
             [80, this.rand(7, 17, 2, 50)],
      ]
    },
  ];

  @Input()
  width: number;

  @Input()
  height: number;

  @Input()
  rangeX: [number, number];

  @Input()
  rangeY: [number, number];

  @Input()
  margin: Margin;

  svg = null;

  CH: number; // Client Height
  CW: number; // CLient Width

  @Input()
  boxWidth: number;

  mBW: number = 10;

  tooltipHtml = (max, min, q1, q2, q3) => `
  <div style="display: flex; justify-content: flex-start; flex-flow: column;">
  <div style="align-self: center;">ESTATÍSTICAS</div>

    <div>Máximo: ${this.decimalPipe.transform(max, "1.4-4")}</div>
    <div>Mínimo: ${this.decimalPipe.transform(min, "1.4-4")}</div>
    <div>1º quantil: ${this.decimalPipe.transform(q1, "1.4-4")}</div>
    <div>2º quantil: ${this.decimalPipe.transform(q2, "1.4-4")}</div>
    <div>3º quantil: ${this.decimalPipe.transform(q3, "1.4-4")}</div>
  </div>
  `;

  constructor(private decimalPipe: DecimalPipe) {

  }

  ngOnInit(): void {
    this.mBW = this.boxWidth/2;
  }

  ngAfterViewInit() {

    const tooltip = d3.select("#tooltip");

    this.CH = this.height - this.margin.bottom - this.margin.top;
    this.CW = this.height - this.margin.right - this.margin.left;
    const svg = d3.select(`#${this.innerId}`)
      .append("svg")
        .attr("width", this.width)
        .attr("height", this.height);

        const x = d3.scaleLinear()
          .domain(this.rangeX)
          .range([this.margin.left, this.width - this.margin.right]);

        const xAxis = d3.axisBottom(x);
        svg.append("g")
          .attr("transform", `translate(0, ${this.height - this.margin.bottom})`)
          .call(xAxis);

        const y = d3.scaleLinear()
                    .domain(this.rangeY)
                    .range([this.height - this.margin.bottom, this.margin.top]);

        const yAxis = d3.axisLeft(y);
        svg.append("g")
          .attr("transform", `translate(${this.margin.left}, 0)`)
          .call(yAxis);

      this.mock.forEach(line =>
        svg
          .append("g")
          .selectAll("g")
          .data(line.data)
          .join(enter => {
            const box = enter.append("g");
            this.plotBox(box, x, y, line.style);
            return box;
          }));


          this.mock.forEach(line =>
            svg.append("g")
            .selectAll("g")
            .data([line.data.map(v => [v[0], d3.median(v[1])] as [number, number])])
            .join(enter => {
            const lineGen = d3.line().x(d => x(d[0])).y(d => y(d[1]));
              enter.append("g").append("path")
                .attr("fill", "none")
                .attr("stroke", line.style.boxColor)
                .datum(d => d)
                .attr("d", d => lineGen(d))


            return null;
          }))
  }


  plotBox = function (selection, x: ScaleLinear<number, number, never>, y: ScaleLinear<number, number, never>, style) {
    const evaluate = (data: [number, number[]]) => {
      return {
        x: data[0],
        max: d3.max(data[1]),
        q3: d3.quantile(data[1], 0.75),
        median: d3.median(data[1]),
        q1: d3.quantile(data[1], 0.25),
        min: d3.min(data[1])
      }
    }
    const g = selection.datum(d => evaluate(d));

    g.append("line")
      .attr("x1", d => x(d.x))
      .attr("x2", d => x(d.x))
      .attr("y1", d => y(d.max))
      .attr("y2", d => y(d.min))
      .attr("stroke", style.boxColor)
      .call(sel => this.tooltip(sel));

    g.append("rect")
      .attr("x", d => x(d.x) - this.mBW)
      .attr("y", d => y(d.q3))
      .attr("width", this.boxWidth)
      .attr("height", d => y(d.q1) - y(d.q3) )
      .attr("fill", "white")
      .attr("stroke", style.boxColor)
      .call(sel => this.tooltip(sel));

    g.append("line")
      .attr("x1", d => x(d.x) - this.mBW)
      .attr("x2", d => x(d.x) + this.mBW)
      .attr("y1", d => y(d.min))
      .attr("y2", d => y(d.min))
      .attr("stroke", style.boxColor)
      .call(sel => this.tooltip(sel));

    g.append("line")
      .attr("x1", d => x(d.x) - this.mBW)
      .attr("x2", d => x(d.x) + this.mBW)
      .attr("y1", d => y(d.max))
      .attr("y2", d => y(d.max))
      .attr("stroke", style.boxColor)
      .call(sel => this.tooltip(sel));

    g.append("line")
      .attr("x1", d => x(d.x) - this.mBW)
      .attr("x2", d => x(d.x) + this.mBW)
      .attr("y1", d => y(d.median))
      .attr("y2", d => y(d.median))
      .attr("stroke", style.boxColor)
      .call(sel => this.tooltip(sel));

  }

  tooltip(selection) {
    const tooltip = d3.select("#tooltip");
    selection
       .on("mouseover", (e, data) => {
          const t = d3.transition().duration(400).ease(d3.easeLinear);
          tooltip
          .html(this.tooltipHtml(data.max, data.min, data.q1, data.median, data.q3))
          .style("visibility", "visible")
          .style("opacity", 0)
          .transition(t)
          .style("opacity", 1)
        })
        .on("mousemove", e => {
          tooltip
            .style("visibility", "visible")
            .style("left", e.pageX + 20 + "px")
            .style("top", e.pageY + "px");
        })
        .on("mouseout", () => {
          const t = d3.transition().duration(400).ease(d3.easeLinear)
          tooltip
          .style("opacity", 1)
          .transition(t)
          .style("opacity", 0)
          .style("visibility", "hidden");
        });
  }

  rand(from, to, std, n) {
    let v = [];
    const mean = from + (to - from) * Math.random();
    for (let i = 0; i < n; ++i)
      v.push(mean + std * Math.random());

    return v;
  }


}
