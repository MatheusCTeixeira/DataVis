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

  width = 900;
  height = 900;
  margin: Margin = {left: 60, right: 30, top: 30, bottom: 30};

  heatmapWidth = 800;
  heatmapGap = 5;
  heatmapScaleWidth = 15;

  constructor() { }

  ngOnInit(): void {
    setTimeout(() => this.draw(), 200);
  }

  draw() {
    const svg = d3.select(`#${this.innerId}`)
      .append("svg")
        .attr("width", this.width)
        .attr("height", this.height)
      .append("g");


    let X = this.genDomain(80);
    let Y = this.genDomain(500);

    const content = svg
        .append("g")
        .attr("class", "content");

    const [scaleH, scaleV] = this.drawAxes(svg, content, X, Y);
    this.genBlocks(content, X, Y, scaleH, scaleV);

    const gradient = svg
      .append("defs")
      .append("linearGradient")
        .attr("gradientTransform", "rotate(90)")
        .attr("id", "scaleGrad");

      gradient.append("stop")
          .attr("offset", "0%")
          .attr("stop-color", "rgba(228,0,0,1)");

      gradient.append("stop")
          .attr("offset", "100%")
          .attr("stop-color", "rgba(73,26,106,1)");

    const colorScale = svg
      .append("g")
        .attr("class", "colorScale")
        .attr("transform", `translate(${this.margin.left + this.heatmapWidth + this.heatmapGap}, ${this.margin.top})`)
        .append("rect")
        .attr("width", this.heatmapScaleWidth)
        .attr("height", this.heatmapWidth)
        .attr("fill", "url(#scaleGrad)");

  }

  drawAxes(svg, content, X: any[], Y: any[]) {
    const hRange = [this.margin.left, this.margin.left + this.heatmapWidth];
    const scaleH = d3.scaleBand(X, hRange).padding(0);
    const axisTop = d3.axisTop(scaleH)
      .tickValues(scaleH.domain().filter((d, i) => {
        const length = scaleH.domain().length;
        return i % (Math.round(length/20)) == 0 || i == length -1;
      }));

    svg.append("g")
        .attr("class", "axisX")
        .attr("transform", `translate(${0}, ${this.margin.top})`)
        .call(axisTop)
      .selectAll("text")
        .attr("class", "ticks")
        .attr("text-anchor", "start")
        .attr("transform", "rotate(-45)")
        .on("click", d => {
          Y = d3.shuffle(Y);
          const previousScaleV = scaleV;
          const vRange = [this.margin.top, this.margin.top + this.heatmapWidth];
          const newScaleV = d3.scaleBand(Y, vRange).padding(0);
          const axisLeft = d3.axisLeft(newScaleV)
                              .tickValues(
                                newScaleV.domain()
                                  .filter((d, i) =>
                                    i % (Math.round(newScaleV.domain().length/10)) == 0));

          svg.select("g.axisV").call(axisLeft);

          this.genBlocks(content, X, Y, scaleH, newScaleV, previousScaleV);
        });

    const vRange = [this.margin.top, this.margin.top + this.heatmapWidth];
    const scaleV = d3.scaleBand(Y, vRange).padding(0);
    const axisLeft = d3.axisLeft(scaleV)
      .tickValues(scaleV.domain().filter((d, i) => i % (Math.round(scaleV.domain().length/10)) == 0));

    svg.append("g")
      .attr("class", "axisV")
      .attr("transform", `translate(${this.margin.left}, ${0})`)
      .call(axisLeft);

    return [scaleH, scaleV];
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

  genBlocks(selection, dataX: any[], dataY: any[], scaleX: any, scaleY: any, previousScaleY: any = null) {
    const t = d3.transition().duration(750).ease(d3.easeLinear);

    const getId = (code, salt) => {
      const n = [];
      for (let i = 0; i < code.length; ++i)
        n.push(code.charCodeAt(i) * (i+salt));

      const value = d3.sum(n);
      return value % 255;
    }

    selection
      .selectAll("g")
      .data(dataY, d => d)
      .join(
        enter => enter
            .append("g")
              .attr("class", "row")
            .selectAll("rect")
            .data(d => { return d3.cross([d], dataX); })
            .join(enter => enter.append("rect")
              .attr("y", d => scaleY(d[0]))
              .attr("x", d => scaleX(d[1]))
              .attr("width", scaleX.bandwidth())
              .attr("height", scaleY.bandwidth())
              .attr("fill", (d, i) => `rgba(${getId(d[0], 65)}, ${getId(d[0], 3)}, ${getId(d[0], 34)}, 0.4)`)),
        update => update
              .attr("transform", d=> { console.log(d); return "translate(0, 0)";})
            .transition(t)
              .attr("transform", d => `translate(0, ${scaleY(d) - previousScaleY(d)})`)

        ,
        exit => exit.remove()
      );
  }

}
