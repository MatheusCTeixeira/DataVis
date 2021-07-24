import { AfterContentInit, AfterViewChecked, Component, Input, OnInit } from '@angular/core';
import * as d3 from "d3";

@Component({
  selector: 'app-heatmap',
  templateUrl: './heatmap.component.html',
  styleUrls: ['./heatmap.component.scss']
})
export class HeatmapComponent implements OnInit {
  @Input()
  innerId: string;

  constructor() { }

  ngOnInit(): void {
    setTimeout(() => this.draw(), 200);
  }

  draw() {
    const svg = d3.select(`#${this.innerId}`)
      .append("svg")
        .attr("width", 900)
        .attr("height", 900)
      .append("g");

    this.drawAxes(svg);
  }

  drawAxes(svg) {
    let X = this.genDomain(120);
    let Y = this.genDomain(600);

    const content = svg
        .append("g")
        .attr("class", "content");

    const scaleH = d3.scaleBand(X, [60, 800]).padding(0);
    const axisTop = d3.axisTop(scaleH)
      .tickValues(scaleH.domain().filter((d, i) => i % 5 == 0));

    svg.append("g")
        .attr("class", "axisX")
        .attr("transform", `translate(${0}, ${30})`)
        .call(axisTop)
      .selectAll("text")
        .attr("text-anchor", "start")
        .attr("transform", "rotate(-45)")
        .on("click", d => {
          Y = d3.shuffle(Y);
          this.genBlocks(content, X, Y, scaleH, scaleV);
        });

    const scaleV = d3.scaleBand(Y, [30, 800]).padding(0);
    const axisLeft = d3.axisLeft(scaleV)
      .tickValues(scaleV.domain().filter((d, i) => i % 15 == 0));

    svg.append("g")
      .attr("transform", `translate(${60}, ${0})`)
      .call(axisLeft);

    this.genBlocks(content, X, Y, scaleH, scaleV);
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

  genBlocks(selection, dataX: any[], dataY: any[], scaleX: any, scaleY: any) {
    console.log(dataY);
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
              .attr("fill", (d, i) => `rgba(${(+dataY.indexOf(d[0])/dataY.length) * 255}, ${i/dataX.length*255}, ${0}, 0.4)`)),
        update => update
            .selectAll("rect")
            .attr("y", d => scaleY(d[0]))
            .attr("x", d => scaleX(d[1]))
            .attr("width", scaleX.bandwidth())
            .attr("height", scaleY.bandwidth())
            .attr("fill", (d, i) => `rgba(${(+dataY.indexOf(d[0])/dataY.length) * 255}, ${i/dataX.length*255}, ${0}, 0.4)`)
        ,
        exit => exit.remove()
      );
  }

}
