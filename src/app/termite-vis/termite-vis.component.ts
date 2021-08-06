import { Component, Input, OnInit } from '@angular/core';
import * as d3 from "d3";
import { Margin } from '../types/margin';

@Component({
  selector: 'app-termite-vis',
  templateUrl: './termite-vis.component.html',
  styleUrls: ['./termite-vis.component.scss']
})
export class TermiteVisComponent implements OnInit {
  @Input()
  innerId: string;

  @Input()
  width;

  @Input()
  height;

  @Input()
  data;

  @Input()
  show;

  @Input()
  margin: Margin;

  @Input()
  barLeftGap: number;

  @Input()
  barWidth: number;

  @Input()
  barMaxLenth: number;

  @Input()
  barLegendGap: number;

  display: boolean = false;

  weeks: number[];

  week: number;

  vDomain: string[];

  hDomain: string[];

  accumulated: d3.InternMap<string, number>;


  constructor() { }

  ngOnInit(): void {
  }

  ngOnChanges(changes) {
    const show = changes.show.currentValue;

    if (show) {
      this.draw();
    }
  }

  preprocess(week = 9) {
    this.weeks = Object.keys(this.data).map(v => +v);
    this.hDomain = Object.keys(this.data[week]);
    this.vDomain = Array.from(new Set(d3.merge(Object.values(this.data[week]).map(v => Object.keys(v)))));

    this.accumulated = new d3.InternMap<string, number>();
    for (let topic_id in <any>this.data[week]) {
      const topic = this.data[week][topic_id];

      for (let word in <any>topic) {
        if (!this.accumulated.hasOwnProperty(word))
          this.accumulated[word] = 0;

          this.accumulated[word] += topic[word];
      }
    }

    const max = <number>d3.max(Object.values(this.accumulated));
    for (let attr in this.accumulated)
      this.accumulated[attr] /= max;
  }

  draw() {
    const svg = d3.select(`div#${this.innerId}`)
      .append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
      .append("g");

    this.preprocess();
    const [vScale, hScale] = this.drawAxes(svg, this.vDomain, this.hDomain);

    this.drawWeeks(svg);

    this.drawGrid(svg, this.vDomain, this.hDomain, vScale, hScale);

    const wordWeight = this.vDomain.map(word => [word, this.accumulated[word]]);
    this.drawBars(svg, wordWeight, this.vDomain, vScale);

    const content = d3.merge(this.hDomain.map(topic => this.vDomain.map(word => [topic, word, 100 * Math.random()])));
    this.drawContent(svg, content, vScale, hScale);

    this.display = true;
  }

  drawWeeks(selection) {
    const weeksRadius = 10;
    const weekPadding = 3;

    selection.append("g")
      .attr("transform", `translate(${this.margin.left/2}, 0)`)
      .classed("weekOptions", true)
      .selectAll("circle")
      .data(this.weeks)
      .join(enter => {
        enter.append("circle")
          .attr("r", weeksRadius)
          .attr("fill", "yellow")
          .attr("cx", (_, i) => (2 * weeksRadius + weekPadding) * i)
          .attr("cy", 40)
          .attr("stroke", "black")
          .style("cursor", "pointer");

        return enter.append("text")
          .text(d => d)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", 8)
          .attr("x", (_, i) => (2 * weeksRadius + weekPadding) * i)
          .attr("y", 40)
          .style("cursor", "pointer");
      });
  }

  drawAxes(selection, vDomain: any[], hDomain: any[]) {
    const vScale = d3.scalePoint(vDomain, [this.margin.top, this.height - this.margin.bottom]).padding(0.3);
    const vAxis = d3.axisLeft(vScale);

    selection.append("g")
      .attr("class", "vAxis")
      .attr("transform", `translate(${this.margin.left}, 0)`)
      .call(vAxis);


    const hScale = d3.scalePoint(hDomain, [this.margin.left, this.width - this.margin.right]).padding(0.3);
    const hAxis = d3.axisTop(hScale);

    selection.append("g")
        .attr("class", "hAxis")
        .attr("transform", `translate(0, ${this.margin.top})`)
        .call(hAxis)
      .selectAll("text")
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "text-bottom")
        .attr("transform", "rotate(-45)");

    return [vScale, hScale];
  }

  drawGrid(selection, vDomain: any[], hDomain: any[], vScale, hScale) {
    const grid = selection.append("g")
      .attr("class", "grid")

    grid
      .selectAll("line.hLineGrid")
      .data(vDomain)
      .join(
        enter => enter.append("line")
          .attr("class", "hLineGrid")
          .attr("x1", d => this.margin.left)
          .attr("y1", d => vScale(d))
          .attr("x2", d => this.width - this.margin.right)
          .attr("y2", d => vScale(d))
          .attr("stroke", "rgba(0,0,0,0.3)"));

    grid
      .selectAll("line.vLineGrid")
      .data(hDomain)
      .join(
        enter => enter.append("line")
          .attr("class", "vLineGrid")
          .attr("x1", d => hScale(d))
          .attr("y1", d => this.margin.top)
          .attr("x2", d => hScale(d))
          .attr("y2", d => this.height - this.margin.bottom)
          .attr("stroke", "rgba(0,0,0,0.3)"));
  }

  drawBars(selection, wordWeight, vDomain, vScale) {
    const barplot = selection.append("g")
      .attr("class", "boxPlot")
      .attr("transform", `translate(${this.width - this.margin.right + this.barLeftGap}, 0)`);

    // Ordena as palavras do tópico de acordo com a frequência
    wordWeight = wordWeight.sort((l, r) => r[1] - l[1]);

    // Zip com o domain para exibir os resultados alinhados com o eixo.
    const formatted = d3.zip(wordWeight, vDomain);

    barplot.selectAll("words")
      .data(formatted)
      .join(enter => {
        enter.append("rect")
            .attr("x", 0)
            .attr("y", (d, i) => vScale(d[1]) - this.barWidth / 2)
            .attr("height", this.barWidth)
            .attr("rx", 0.2 * this.barWidth)
            .attr("width", (d, i) => 0)
            .attr("fill", _ => d3.interpolateReds(0))
          .transition()
            .duration(5000)
            .ease(d3.easeLinear)
            .attr("width", (d, i) => d[0][1] * this.barMaxLenth)
            .attr("fill", d => d3.interpolateReds(d[0][1]));

        enter.append("text")
          .attr("dominant-baseline", "middle")
          .attr("x", 0)
          .attr("y", d => vScale(d[1]))
          .attr("dx", 0)
          .attr("font-size", 0.7* this.barWidth)
          .html(d => d[0][0])
          .transition()
          .duration(5000)
          .ease(d3.easeLinear)
          .attr("dx", d => d[0][1] * this.barMaxLenth + this.barLegendGap)
      });
  }

  drawContent(selection, content, vScale, hScale) {

    selection.append("g")
        .attr("class", "content")
      .selectAll("circle")
      .data(content)
      .join(enter =>
        enter.append("circle")
          .attr("cx", d => hScale(d[0]))
          .attr("cy", d => vScale(d[1]))
          .attr("r", 0)
          .attr("fill", d => d3.interpolateReds(0))
          .attr("stroke", "black")
          .call(this.tooltip)
          .transition()
          .duration(5000)
          .ease(d3.easeLinear)
          .attr("fill", d => d3.interpolateReds(Math.random()))
          .attr("r", d => Math.sqrt(100 * Math.random()))
          )

  }

  genDomain(sz) {
    const alpha = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o"]
    let result = [];
    for (let i = 0; i < sz; ++i) {
      let ind = "";
      for (let k = 0; k < 5; ++k)
        ind += alpha[Math.floor(Math.random() * alpha.length)];
        result.push(ind);
    }

    return result;
  }

  tooltipHtml(v) {
    return "Mouse over";
  }

  tooltip = (selection) => {
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



}
