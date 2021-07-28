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
export class BoxplotComponent implements OnInit {

  @Input()
  innerId: string;

  @Input()
  data: {label?: string, style?: {boxColor?: any}, data: [number, number][]}[];

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
    setTimeout(() => this.draw(), 500);
  }

  draw() {

    const tooltip = d3.select("#tooltip");

    this.CH = this.height - this.margin.bottom - this.margin.top;
    this.CW = this.height - this.margin.right - this.margin.left;
    const svg = d3.select(`#${this.innerId}`)
      .append("svg")
        .attr("width", this.width)
        .attr("height", this.height);

        const x = d3.scalePoint()
          .padding(0.5)
          .domain(this.data.map(row => row.label))
          .range([this.margin.left, this.width - this.margin.right]);

        const xAxis = d3.axisBottom(x);
        svg.append("g")
          .attr("transform", `translate(0, ${this.height - this.margin.bottom})`)
          .call(xAxis);

        const y = d3.scaleLinear()
                    .domain([0, 2000000])
                    .range([this.height - this.margin.bottom, this.margin.top]);

        const yAxis = d3.axisLeft(y).tickFormat(d => this.magnitude(d));
        svg.append("g")
          .attr("transform", `translate(${this.margin.left}, 0)`)
          .call(yAxis);



        svg
          .append("g")
          .selectAll("g")
          .data(this.data)
          .join(enter => {
            return enter.append("g")
              .call(this.plotBox, x, y, this);
          });

        const f = d3.line().x(d => x(this.data[d[0]].label)).y(d => y(d[1]));

        svg
          .append("g")
          .append("path")
          .attr("fill", "none")
          .attr("stroke", "black")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "2  2")
          .datum(this.data.map((entry, i) => [i, d3.mean(entry.data.map(value => value[1]))] as [number, number]))
          .attr("d", d => f(d));


  }


  plotBox(selection, x, y, self) {
    const evaluate = (i, data: any) => {
      const values = data.data.map(entry => entry[1]);

      return {
        x: data.label,
        max: d3.max(values),
        q3: d3.quantile(values, 0.75),
        median: d3.median(values),
        q1: d3.quantile(values, 0.25),
        min: d3.min(values),
        color: data.style.boxColor
      }
    }
    const g = selection.datum((d, i) => evaluate(i, d));

    g.append("line")
      .attr("x1", d => x(d.x))
      .attr("x2", d => x(d.x))
      .attr("y1", d => y(d.max))
      .attr("y2", d => y(d.min))
      .attr("stroke", d => d.color)
      .call(sel => self.tooltip(sel));

    g.append("rect")
      .attr("x", d => x(d.x) - self.mBW)
      .attr("y", d => y(d.q3))
      .attr("width", self.boxWidth)
      .attr("height", d => Math.abs(y(d.q1) - y(d.q3)))
      .attr("fill", "white")
      .attr("stroke", d => d.color)
      .call(sel => self.tooltip(sel));

    g.append("line")
      .attr("x1", d => x(d.x) - self.mBW)
      .attr("x2", d => x(d.x) + self.mBW)
      .attr("y1", d => y(d.min))
      .attr("y2", d => y(d.min))
      .attr("stroke", d => d.color)
      .call(sel => self.tooltip(sel));

    g.append("line")
      .attr("x1", d => x(d.x) - self.mBW)
      .attr("x2", d => x(d.x) + self.mBW)
      .attr("y1", d => y(d.max))
      .attr("y2", d => y(d.max))
      .attr("stroke", d => d.color)
      .call(sel => self.tooltip(sel));

    g.append("line")
      .attr("x1", d => x(d.x) - self.mBW)
      .attr("x2", d => x(d.x) + self.mBW)
      .attr("y1", d => y(d.median))
      .attr("y2", d => y(d.median))
      .attr("stroke", d => d.color)
      .call(sel => self.tooltip(sel));

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

  magnitude(value) {
    let i = 1;
    while ((value / (Math.pow(10, i))) > 1)
      i += 1;

    const idx = Math.floor(i / 3);
    return (value / (Math.pow(10, 3 * idx))).toString() + ["", "k", "M", "B"][idx];
  }


}
