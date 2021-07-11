import { DecimalPipe } from '@angular/common';
import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import * as d3 from "d3";
import { BarData, BarSeries } from '../types/bardata';
import { Margin } from '../types/margin';
import { Style } from '../types/style';

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
export class BarplotComponent implements OnInit, AfterViewInit {
  @Input()
  innerId: string;

  @Input()
  margin: Margin;

  @Input()
  height: number;

  @Input()
  width: number;

  @Input()
  data_b: BarSeries[];

  @Input()
  data: BarSeries[];

  @Input()
  stacked: boolean;

  @Input()
  animate: boolean;

  @Input()
  rangeX: [number, number];

  @Input()
  rangeY: [number, number];

  @Input()
  axisX: string;

  @Input()
  axisY: string;

  stackValues: number[];

  once = true;

  constructor(private decimalPipe: DecimalPipe) { }

  ngOnInit(): void {

  }

  ngAfterViewInit() {
    this.plot();
  }

  plot() {
    const svg = d3.select(`#${this.innerId}`)
      .append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
      .append("g");

    const hScale = d3.scaleLinear()
                    .domain(this.rangeX)
                    .range([this.margin.left, this.width - this.margin.right]);

    const hAxis = d3.axisBottom(hScale).ticks(15);

    svg.call(sel => this.addLegend(sel));

    svg
    .append("g")
      .attr("transform", `translate(0, ${this.height - this.margin.bottom})`)
      .call(hAxis);

    const vScale = d3.scaleLinear()
        .domain(this.rangeY)
        .range([this.height - this.margin.bottom, this.margin.top]);

    const vAxis = d3.axisLeft(vScale).tickFormat((v: number) => `${Math.round(v/1000000)}M`);

    svg.append("g")
      .attr("transform", `translate(${this.margin.left}, 0)`).call(vAxis);

    this.data.forEach((row, i) => {
      console.log(row);
      if (this.stacked)
        if (this.stackValues != null)
          this.stackValues = this.data[i-1].series.map((v, i) => v.y + this.stackValues[i]);
        else
          this.stackValues = row.series.map(v => 0);

      svg
        .append("g")
        .selectAll("rect")
        .data(row.series)
        .join(
          enter => {
            const t = d3.transition().duration(500).delay(500).ease(d3.easeSinInOut);
            const rect = enter
                .append("rect")
                  .call(enter => this.tooltip(enter))
                  .attr("fill", row.style.fillColor)
                .call(sel => this.drawBar(sel, hScale, vScale))
            return rect;
          });
    })
  }

  drawBar(enter, x: d3.ScaleLinear<number, number, never>, y: d3.ScaleLinear<number, number, never>) {
    if (this.stacked) {
      enter
      .attr("x", (d: any) => x(d.x))
      .attr("y", (d: any, i) => y(d.y + this.stackValues[i]))
      .attr("width", 0.8 * (x(1) - x(0)))
      .attr("height", d => y(0) - y(d.y));
    }
  }

  tooltipHtml(i) {
    let message = `
    <div style="display: flex; justify-content: flex-start; flex-flow: column;">
      <div style="align-self: center;">ESTATÍSTICAS</div>
      <div>Semana: ${i}</div>`

    const total = this.data.map(v => v.series[i-1].y).reduce((a, b) => a + b);
    for (let bar of this.data.reverse()) {
      const value = bar.series[i-1].y;
      const pp = 100 * value / total;
      const formatedValue = this.decimalPipe.transform(value, "1.0-0", "pt");
      const formatedPP = this.decimalPipe.transform(pp, "1.2-2", "pt");
     message += `<div>${bar.label}: ${formatedValue} (${formatedPP}%)</div>`;
    }

    message += "</div>"
    return message;
  }

  tooltip(selection) {
    const tooltip = d3.select("#tooltip");
    selection
       .on("mouseover", (e, data) => {
          const t = d3.transition().duration(400).ease(d3.easeLinear);
          tooltip
          .html(this.tooltipHtml(data.x))
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

    return selection;
  }

  addLegend(selection) {
    selection
      .append("g")
      .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(${this.width/2}, ${this.height})`)
        .html(this.axisX);

    selection
      .append("g")
      .append("text")
        .attr("text-anchor", "middle")
        .attr("transform", `translate(15, ${this.height/2}) rotate(270)`)
        .html(this.axisY);

  }
}