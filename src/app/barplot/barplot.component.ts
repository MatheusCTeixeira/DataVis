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
export class BarplotComponent implements OnInit {
  @Input()
  innerId: string;

  @Input()
  margin: Margin;

  @Input()
  height: number;

  @Input()
  width: number;

  @Input()
  data: {keys: string[], colors: string[], values: [string, number, number][][]};

  @Input()
  stacked: boolean;

  @Input()
  animate: boolean;

  @Input()
  rangeX: [number, number];

  domain: string[];

  @Input()
  rangeY: [number, number];

  @Input()
  axisX: string;

  @Input()
  axisY: string;

  @Input()
  show: boolean = false;

  display: boolean = false;

  stackValues: number[];

  maxValue = 0;

  constructor(private decimalPipe: DecimalPipe) { }

  ngOnInit(): void {

  }

  ngOnChanges(changes) {
    const show = changes.show?.currentValue;

    if (show === true)
      this.draw();
  }

  draw() {
    this.maxValue = d3.max(this.data.values.map(v => v[v.length -1][2]));
    this.domain = this.data.values.map(bars => bars.map(bar => bar[0])[0]);

    const screenWidth = d3.select("#mainContent").style("width");

    const svg = d3.select(`#${this.innerId}`)
      .append("svg")
        .attr("width", this.width)
        .attr("width", screenWidth)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("viewBox", `${0} ${0} ${this.width} ${this.height}`)

      .append("g");

    const hScale = d3.scaleBand()
                    .domain(this.domain)
                    .range([this.margin.left, this.width - this.margin.right])
                    .paddingInner(0.1)
                    .round(true);

    const hAxis = d3.axisBottom(hScale).ticks(15);

    svg.call(sel => this.addLegend(sel));

    svg
    .append("g")
      .attr("transform", `translate(0, ${this.height - this.margin.bottom})`)
      .call(hAxis);

    const vScale = d3.scaleLinear()
        .domain([0, this.maxValue])
        .range([this.height - this.margin.bottom, this.margin.top]);

    const vAxis = d3.axisLeft(vScale).tickFormat((v: number) => `${Math.round(v/1000000)}M`);

    svg.append("g")
      .attr("transform", `translate(${this.margin.left}, 0)`)
      .call(vAxis);

    this.drawBars(svg, vScale, hScale);

    this.drawDiff(svg, this.width/2, 0, this.width/2, this.height/3)

    this.display = true;
  }

  drawBars(selection, vScale, hScale) {
    selection
    .append("g")
    .attr("class", "bars")
    .selectAll("g")
    .data(this.data.values)
    .join(enter => {
      const bars = enter
        .append("g")
          .attr("class", "bar");

      bars.selectAll("g")
        .data(d => d, key => key[0])
        .join(enter => enter
            .append("rect")
              .attr("x", d => hScale(`${d[0]}`))
              .attr("y", (d, i) => vScale(d[2]))
              .attr("width", (d, i) => hScale.bandwidth())
              .attr("height", (d, i) => vScale(d[1]) - vScale(d[2]))
              .attr("fill", (d, i) => this.data.colors[i])
              .call((sel) => this.tooltip(sel)));

      return bars;
    });
  }

  drawDiff(selection, xBase, yBase, width, height) {
    const diffs = this.data.values.map(v => <[string, number]>[v[0][0], (v[0][2] - v[0][1])/(v[1][2] - v[1][1])]);
    const maxDiff = d3.max(diffs.map(v => v[1]));
    diffs.forEach(v => v[1] = 100*v[1]/maxDiff);

    const vScale = d3.scaleLinear()
      .domain([0, 100])
      .range([height, yBase + this.margin.top]);

    const vAxis = d3.axisLeft(vScale);

    selection.append("g")
      .attr("transform", `translate(${xBase}, 0)`)
      .call(vAxis);

    const hScale = d3.scaleBand()
      .domain(this.domain)
      .range([xBase, xBase + width])
      .paddingInner(0.2)
      .round(true);

    const hAxis = d3.axisBottom(hScale).tickValues(this.domain.filter((_, i) => i % 5 == 0));

    selection.append("g")
      .attr("transform", `translate(0, ${vScale(0)})`)
      .call(hAxis);

    selection.append("g")
      .attr("class", "barsDiff")
      .selectAll("rect")
      .data(diffs)
      .join(enter =>
        enter.append("rect")
          .attr("x", d => hScale(d[0]))
          .attr("width", hScale.bandwidth())
          .attr("y", d => vScale(d[1]))
          .attr("height", d => vScale(0) - vScale(d[1]))
          .attr("fill", "rgba(12, 12, 226, 0.8)")
      );

    selection.append("g")
      .append("line")
        .attr("x1", hScale("1"))
        .attr("x2", hScale("36") + hScale.bandwidth())
        .attr("y1", vScale(100))
        .attr("y2", vScale(100))
        .attr("stroke", "rgba(190, 12, 226, 0.8)");

    selection.append("text")
      .attr("x", hScale("15"))
      .attr("y", vScale(100) - 5)
      .html("Ref: # Fem.");

    selection.append("text")
      .attr("x", hScale("15"))
      .attr("y", yBase + height + 30)
      .html("Semana");

      selection.append("text")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${xBase - 30}, ${vScale(50)}) rotate(-90)`)
      .html("Razão (%)");

  }


  tooltipHtml(i) {
    let message = `
    <div style="display: flex; justify-content: flex-start; flex-flow: column;">
      <div style="align-self: center;">ESTATÍSTICAS</div>
      <div>Semana: ${i}</div>`

      const values = this.data.values.filter(v => v[0][0] === i)[0];
      const total = values[values.length - 1][2];

      for (let k = 0; k < this.data.keys.length; ++k) {
        const value = values[k][2] - values[k][1]; // Yf - Y0
        const pp = 100 * value / total;
        const formatedValue = this.decimalPipe.transform(value, "1.0-0", "pt");
        const formatedPP = this.decimalPipe.transform(pp, "1.2-2", "pt");
        message += `<div>${this.data.keys[k]}: ${formatedValue} (${formatedPP}%)</div>`;
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
          .html(this.tooltipHtml(data[0]))
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