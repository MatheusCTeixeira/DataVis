import { Component, Input, OnInit } from '@angular/core';
import * as d3 from "d3";
import { HAlignment, VAlignment } from '../types/align';
import { Dimension } from '../types/dimension';
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

  _data; // internal representation of data

  @Input()
  show;

  @Input()
  margin: Margin;

  // Bar customizations

  @Input()
  barLeftGap: number;

  @Input()
  barWidth: number;

  @Input()
  barMaxLenth: number;

  @Input()
  barLegendGap: number;

  // Weeks axis customizations

  @Input()
  weekAxisDim: Dimension;

  @Input()
  weekAxisVAlignment: VAlignment;

  @Input()
  weekAxisHAlignment: HAlignment;

  @Input()
  weeksRadius;

  @Input()
  weekPadding;

  display: boolean = false;

  weeks: [number, boolean][];

  week: number;

  vDomain: string[];

  hDomain: string[];

  accumulated: d3.InternMap<string, number>;

  substitute = {
    "covid": "covid19",
    "coronavirus": "covid19",
    "corona": "covid19",
    "cloroquina": "hidroxicloroquina",
    "extra": "renda extra",
    "renda": "renda extra",
    "apoio": "apoio geral",
    "geral": "apoio geral",
    "paulo": "sao paulo",
    "gov": "governador",
    "isolamento": "isolamento social",
    "social": "isolamento social",
    "min": "ministro",
    "leitos": "uti",
    "camila": "camila pitanga",
    "pitanga": "camila pitanga",
  }


  public get VAlignment() {
    return VAlignment;
  }

  constructor() {

  }

  ngOnInit(): void {
  }

  ngOnChanges(changes) {
    const show = changes.show.currentValue;

    if (show) {
      this.draw();
    }
  }

  preprocess(week) {
    this.weeks = Object.keys(this.data).map(v => [+v, this.data[v] != null]);

    let maxOfWeek = 0;
    this.accumulated = new d3.InternMap<string, number>();
    for (let topic_id in <any>this.data[week]) {
      const topic = this.data[week][topic_id];

      for (let word in <any>topic) {
        if (this.substitute.hasOwnProperty(word)) {
          const value = this.data[week][topic_id][word];
          delete this.data[week][topic_id][word];
          word = this.substitute[word];
          if (!this.data[week][topic_id].hasOwnProperty(word))
          this.data[week][topic_id][word] = 0;
          this.data[week][topic_id][word] += value;
        }

        if (!this.accumulated.hasOwnProperty(word))
          this.accumulated[word] = 0;

        this.accumulated[word] += topic[word];
        maxOfWeek = d3.max([topic[word], maxOfWeek]);
      }
    }

    const max = <number>d3.max(Object.values(this.accumulated));

    for (let attr in this.accumulated)
      this.accumulated[attr] /= max;

    this.hDomain = Object.keys(this.data[week]);
    this.vDomain = Array.from(new Set(d3.merge(Object.values(this.data[week]).map(v => Object.keys(v)))));


    this._data = d3.cross(this.hDomain, this.vDomain)
      .map(X => [X[0], X[1], this.data[week][X[0]][X[1]]  != null ? this.data[week][X[0]][X[1]]/ maxOfWeek : 0]);
  }

  clear() {
    d3.select(`div#${this.innerId}-weeks`).selectAll("*").remove();
    d3.select(`div#${this.innerId}-content`).selectAll("*").remove();
  }

  draw(week = 1) {
    this.week = week;
    this.clear();

    this.preprocess(week);

    const screenWidth = d3.select("#mainContent").style("width");

    const svg = d3.select(`div#${this.innerId}-content`)
      .append("svg")
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("viewBox", `${0} ${0} ${this.width} ${this.height}`)
        .attr("width", screenWidth)
      .append("g");

    const [vScale, hScale] = this.drawAxes(svg, this.vDomain, this.hDomain);

    this.drawWeeks();

    this.drawGrid(svg, this.vDomain, this.hDomain, vScale, hScale);

    const wordWeight = this.vDomain.map(word => [word, this.accumulated[word]]);
    this.drawBars(svg, wordWeight, this.vDomain, vScale);

    this.drawContent(svg, this._data, vScale, hScale);

    this.display = true;
  }

  drawWeeks() {
    const self = this;
    const diameter = 2 * this.weeksRadius;

    const screenWidth = d3.select("#mainContent").style("width");

    const svg = d3.select(`div#${this.innerId}-weeks`)
      .append("svg")
      .attr("width", screenWidth)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("viewBox", `${this.weekAxisDim.x} ${this.weekAxisDim.y} ${this.weekAxisDim.width} ${this.weekAxisDim.height}`);

    const handler = function (d, i) {
      const sel = d3.select(this);

      if (d[1])
        sel.on("click", (_, week) => self.draw(week[0]))
          .style("cursor", "pointer");
      else
        sel.style("cursor", "not-allowed")
          .style("opacity", 0.3);
    }

    let x = 0, y = 0;
    if (this.weekAxisVAlignment == VAlignment.TOP)
      y = this.weeksRadius;
    else if (this.weekAxisVAlignment == VAlignment.BOTTOM)
      y = this.weekAxisDim.height - this.weeksRadius;
    else if (this.weekAxisVAlignment == VAlignment.CENTER)
      y = this.weekAxisDim.height/2;

    const _width = (diameter + this.weekPadding) * (this.weeks.length - 1) + this.weeksRadius;
    if (this.weekAxisHAlignment == HAlignment.LEFT)
      x = this.weeksRadius;
    else if (this.weekAxisHAlignment == HAlignment.RIGHT)
      x = this.weekAxisDim.width - _width;
    else if (this.weekAxisHAlignment == HAlignment.CENTER)
      x = (this.weekAxisDim.width - _width)/2;

    svg.append("g")
      .classed("weekOptions", true)
      .selectAll("circle")
      .data(this.weeks)
      .join(enter => {
        enter.append("circle")
          .attr("r", this.weeksRadius)
          .attr("fill", d => d[1] ? "yellow" : "gray")
          .attr("cx", (_, i) => x + (diameter + this.weekPadding) * i)
          .attr("cy", y)
          .attr("stroke", "black")
          .style("opacity", d => this.week == d[0] ? 1 : 0.4)
          .each(handler);

        return enter.append("text")
          .text(d => d[0])
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("font-size", 9)
          .attr("font-weight", 700)
          .attr("x", (_, i) => x + (diameter + this.weekPadding) * i)
          .attr("y", y)
          .each(handler);

      });
  }

  drawAxes(selection, vDomain: any[], hDomain: any[]) {
    const vScale = d3.scalePoint(vDomain, [this.margin.top + 2 * 20, this.height - this.margin.bottom]).padding(0.3);
    const vAxis = d3.axisLeft(vScale);

    selection.append("g")
      .attr("class", "vAxis")
      .attr("transform", `translate(${this.margin.left}, 0)`)
      .call(vAxis);


    const hScale = d3.scalePoint(hDomain, [this.margin.left, this.width - this.margin.right]).padding(0.3);
    const hAxis = d3.axisTop(hScale);

    selection.append("g")
        .attr("class", "hAxis")
        .attr("transform", `translate(0, ${this.margin.top + 2 * 20})`)
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
          .attr("y1", d => this.margin.top + 2 * 20)
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
            .duration(1000)
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
          .duration(1000)
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
            .duration(1000)
            .ease(d3.easeLinear)
            .attr("fill", d => d3.interpolateReds(d[2]))
            .attr("r", d => Math.sqrt(100 * d[2])))

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
