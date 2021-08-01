import { AfterViewInit, Component, Input, OnInit } from '@angular/core';
import * as d3 from "d3";
import { ScaleLinear } from 'd3';
import { Margin } from '../types/margin';
import { DatePipe, DecimalPipe } from "@angular/common";

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

  @Input()
  boxWidth: number;

  @Input()
  show: boolean = false;

  display: boolean = false;

  svg = null;

  CH: number; // Client Height
  CW: number; // CLient Width


  mBW: number = 10;

  tooltipHtml = (max, min, q1, q2, q3) => `
  <div style="display: flex; justify-content: flex-start; flex-flow: column;">
  <div style="align-self: center;">ESTATÍSTICAS</div>

    <div>Máximo: ${this.decimalPipe.transform(max, "1.4-4")}</div>
    <div>1º quantil: ${this.decimalPipe.transform(q1, "1.4-4")}</div>
    <div>2º quantil: ${this.decimalPipe.transform(q2, "1.4-4")}</div>
    <div>3º quantil: ${this.decimalPipe.transform(q3, "1.4-4")}</div>
    <div>Mínimo: ${this.decimalPipe.transform(min, "1.4-4")}</div>
  </div>
  `;

  toolTipHtmlForOutlier = (data) => {
    const base = new Date(2020, 4, 26);
    const days = data[1].week * 7;
    const offset = {"Seg": 1, "Ter": 2, "Qua": 3, "Qui": 4, "Sex": 5, "Sáb": 6, "Dom": 0}
    const date = base.setDate(base.getDate() + days + offset[data[0]]);

    return `
    <div style="display: flex; justify-content: flex-start; flex-flow: column;">
    <div style="align-self: center;">OUTLIER</div>
      <div>${data[0]}</div>
      <div>Dia: ${this.datePipe.transform(date, "dd/MM/yyyy")}</div>
      <div># Tweets: ${this.decimalPipe.transform(data[1].n_tweets, "1.0-0", "pt")}</div>
    </div>
  `;
  }

  constructor(
    private datePipe: DatePipe,
    private decimalPipe: DecimalPipe) {

  }

  ngOnInit(): void {
    this.mBW = this.boxWidth/2;
  }

  ngOnChanges(changes) {
    const show = changes.show?.currentValue;

    if (show === true)
      this.draw();
  }

  draw() {
    const maxValue = d3.max(this.data.map(v => v.data.map(v => v[1])).map(v => d3.max(v)));

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
                .domain([0, maxValue * 1.2])
                .range([this.height - this.margin.bottom, this.margin.top]);

    const yAxis = d3.axisLeft(y).tickFormat(d => this.magnitude(d));

    svg.append("g")
      .attr("transform", `translate(${this.margin.left}, 0)`)
      .call(yAxis);

    svg.append("g")
      .selectAll("g")
      .data(this.data)
      .join(enter => enter.append("g")
          .call(this.plotBox, x, y, this)
      );

    const f = d3.line()
      .x(d => x(this.data[d[0]].label))
      .y(d => y(d[1]));

    svg
      .append("g")
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "black")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2  2")
      .datum(this.data.map((byDay, i) => <[number, number]>[i, d3.mean(byDay.data.map(byWeek => byWeek[1]))]))
      .attr("d", d => f(d));

    this.addLegend(svg);

    this.display = true;
  }

  addLegend(selection) {
    selection.append("text")
      .text("Quantidade de tweets por dia")
      .attr("class", "title")
      .attr("x", this.width/2)
      .attr("y", 15)
      .attr("text-anchor", "middle")
      .style("font-height", 20);

    selection.append("text")
      .text("# tweets")
      .attr("class", "y-label")
      .attr("dominant-baseline", "middle")
      .attr("text-anchor", "middle")
      .attr("transform", `translate(${15}, ${this.height/2}) rotate(-90)`)
      .style("font-height", 10);

    selection.append("text")
      .text("Dia da semana")
      .attr("class", "x-label")
      .attr("x", this.width/2)
      .attr("y", this.height)
      .attr("text-anchor", "middle")
      .style("font-height", 10);
  }


  plotBox(selection, x, y, self) {
    const evaluate = (data) => {
      let _data = data.data.map(entry => entry[1]);
      const std = d3.deviation(_data);
      const mean = d3.mean(_data);
      const values = [];
      const outliers = [];

      for (let v of data.data) // [week, # tweets]
        if ((v[1] < mean + 2 * std) && (v[1] > mean - 2 * std)) {
          values.push(v[1]);
        } else {
          outliers.push({week: v[0], n_tweets: v[1]});
        }

      return {
        x: data.label,
        max: d3.max(values),
        q3: d3.quantile(values, 0.75),
        median: d3.median(values),
        q1: d3.quantile(values, 0.25),
        min: d3.min(values),
        outliers: outliers,
        color: data.style.boxColor
      }
    }
    const g = selection.datum(d => evaluate(d));

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

    g.selectAll("circle")
      .data(d => d3.cross([d.x], d.outliers))
      .join(enter =>
        enter.append("circle")
          .attr("cx", d => x(d[0]))
          .attr("cy", d => y(d[1].n_tweets))
          .attr("r", 3)
          .attr("fill", "red")
          .call(sel => self.tooltip(sel, true))
      )

  }

  tooltip(selection, outlier=false) {
    const tooltip = d3.select("#tooltip");
    selection
       .on("mouseover", (e, data) => {
          const t = d3.transition().duration(400).ease(d3.easeLinear);

          tooltip
          .html(outlier ? this.toolTipHtmlForOutlier(data) : this.tooltipHtml(data.max, data.min, data.q1, data.median, data.q3))
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
