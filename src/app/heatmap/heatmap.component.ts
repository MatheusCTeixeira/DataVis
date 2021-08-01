import { DecimalPipe } from '@angular/common';
import { AfterContentInit, AfterViewChecked, Component, Input, OnInit } from '@angular/core';
import * as d3 from "d3";
import { Margin } from '../types/margin';

@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.scss']
})
export class HeatmapComponent implements OnInit {
  @Input()
  innerId: string;

  @Input()
  data: any[] = null;

  @Input()
  width;

  @Input()
  height;

  @Input()
  margin;

  @Input()
  show: boolean;

  display: boolean = false;

  heatmapWidth = 800;
  heatmapGap = 15;
  heatmapScaleWidth = 30;

  constructor(private _decPipe: DecimalPipe) { }

  ngOnInit(): void {

  }

  ngOnChanges(changes: any) {
    const show = changes.show.currentValue;

    if (show === true)
      this.draw();
  }

  draw() {
    const svg = d3.select(`#${this.innerId}`)
      .append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
      .append("g");


    let X = Object.keys(this.data[0]).filter(key => key != "group");
    let Y = this.data.map(row => +row.group)

    const content = svg
        .append("g")
        .attr("class", "content");

    const [scaleH, scaleV] = this.drawAxes(svg, content, X, Y);
    this.genBlocks(content, scaleH, scaleV);

    this.drawScaler(svg);
    this.display = true;
  }

  drawScaler(selection) {
    const gradient = selection
      .append("defs")
      .append("linearGradient")
        .attr("gradientTransform", "rotate(90)")
        .attr("id", "scaleGrad");

    gradient
      .selectAll("stop")
      .data(d3.ticks(0, 1, 50))
      .join(enter => enter.append("stop")
        .attr("offset", d => `${100*d}%`)
        .attr("stop-color", d => d3.interpolateInferno(1-d)));

    const group = selection.append("g")
    group
        .attr("class", "colorScale")
        .attr("transform", `translate(${this.margin.left + this.heatmapWidth + this.heatmapGap}, ${this.margin.top})`)
      .append("rect")
        .attr("width", this.heatmapScaleWidth)
        .attr("height", this.heatmapWidth)
        .attr("fill", "url(#scaleGrad)");

    group.call(d3.brushY().on("brush", (e)=> e))
    const offsetX = this.heatmapScaleWidth;
    const ticks = d3.ticks(0, 1, 20);
    group
      .selectAll("text")
      .data(ticks)
      .join(enter => {enter.append("text")
          .text(d => this._decPipe.transform(d, "1.2-2"))
          .attr("x", offsetX + 3)
          .attr("y", d => (1-d) * this.heatmapWidth)
          .attr("dominant-baseline", "middle")
          .attr("font-size", 11)
          .attr("fill", "#000")
       return enter.append("line")
          .attr("x1", offsetX - this.heatmapScaleWidth/3)
          .attr("x2", offsetX + 3)
          .attr("y1", d => (1-d) * this.heatmapWidth)
          .attr("y2", d => (1-d) * this.heatmapWidth)
          .attr("stroke", "#000")
          .attr("stroke-width", 1)});
  }

  drawAxes(svg, content, X: any[], Y: any[]) {
    const hRange = [this.margin.left, this.margin.left + this.heatmapWidth];
    const scaleH = d3.scaleBand(X, hRange).padding(0).round(true);
    const axisTop = d3.axisTop(scaleH);

    svg.append("g")
        .attr("class", "axisX")
        .attr("transform", `translate(${0}, ${this.margin.top})`)
        .call(axisTop)
      .selectAll("text")
        .attr("class", "ticks")
        .attr("dominant-baseline", "hanging")
        .attr("text-anchor", "start")
        .attr("transform", "translate(5, -10) rotate(-60)")
        .style("cursor", "pointer")
        .on("click", d => {
          const feature = d3.select(d.srcElement).html();
          this.data = this.data.sort((a, b) => +b[feature] - +a[feature])

          const prevScaleV = scaleV;
          Y = this.data.map(row => +row.group)
          const vRange = [this.margin.top, this.margin.top + this.heatmapWidth];
          const newScaleV = d3.scaleBand(Y, vRange).round(true);
          const axisLeft = d3.axisLeft(newScaleV)
                              .tickValues(
                                newScaleV.domain()
                                  .filter((d, i) =>
                                    i % (Math.round(newScaleV.domain().length/10)) == 0));

          svg.select("g.axisV").call(axisLeft);

          this.genBlocks(content, scaleH, newScaleV, prevScaleV);
        });

    const vRange = [this.margin.top, this.margin.top + this.heatmapWidth];
    const scaleV = d3.scaleBand(Y, vRange).padding(0).round(true);
    const axisLeft = d3.axisLeft(scaleV)
      .tickValues(scaleV.domain().filter((d, i) => i % (Math.round(scaleV.domain().length/10)) == 0));

    svg.append("g")
      .attr("class", "axisV")
      .attr("transform", `translate(${this.margin.left}, ${0})`)
      .call(axisLeft);

    return [scaleH, scaleV];
  }



  genBlocks(selection, scaleX: any, scaleY: any, previousScaleY: any = null) {
    const t = d3.transition().duration(750).ease(d3.easeLinear);

    selection
      .selectAll("g")
      .data(this.data, d => +d.group)
      .join(
        enter => enter
            .append("g")
              .attr("class", "row")
            .selectAll("rect")
            .data(d => d3.cross([+d.group], Object.entries(d).filter(pair => pair[0] != "group")))
            .join(enter => enter.append("rect")
              .attr("y", d => {return scaleY(d[0]);})
              .attr("x", d => scaleX(d[1][0]))
              .attr("width", scaleX.bandwidth())
              .attr("height", scaleY.bandwidth())
              .attr("fill", (d, i) => d3.interpolateInferno(+d[1][1]))),
        update => update
              .attr("transform", d => "translate(0, 0)")
            .transition(t)
              .attr("transform", d => `translate(0, ${scaleY(+d.group) - previousScaleY(+d.group)})`)
      );
  }

}
