import { Component, Input, OnInit } from '@angular/core';
import * as d3 from "d3";

@Component({
  selector: 'app-termite-vis',
  templateUrl: './termite-vis.component.html',
  styleUrls: ['./termite-vis.component.scss']
})
export class TermiteVisComponent implements OnInit {
  @Input()
  innerId: string;

  constructor() { }

  ngOnInit(): void {
    setTimeout(() => this.draw(), 200);
  }

  draw() {
    const svg = d3.select(`div#${this.innerId}`)
      .append("svg")
        .attr("width", 900)
        .attr("height", 900)
      .append("g");

    const vDomain = this.genDomain(30);
    const hDomain = this.genDomain(40);
    const [vScale, hScale] = this.drawAxes(svg, vDomain, hDomain);

    this.drawGrid(svg, vDomain, hDomain, vScale, hScale);

    const wordWeight = vDomain.map(word => [word, 25 * Math.random()]);
    this.drawBars(svg, wordWeight, vDomain, vScale);

    const content = d3.merge(hDomain.map(topic => vDomain.map(word => [topic, word, 100 * Math.random()])));
    this.drawContent(svg, content, vScale, hScale);
  }

  drawAxes(selection, vDomain: any[], hDomain: any[]) {
    const vScale = d3.scalePoint(vDomain, [800, 30]).padding(0.3);
    const vAxis = d3.axisLeft(vScale);

    selection.append("g")
      .attr("class", "vAxis")
      .attr("transform", `translate(60, 0)`)
      .call(vAxis);


    const hScale = d3.scalePoint(hDomain, [60, 800]).padding(0.3);
    const hAxis = d3.axisTop(hScale);

    selection.append("g")
        .attr("class", "hAxis")
        .attr("transform", `translate(0, 30)`)
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
          .attr("x1", d => 60)
          .attr("y1", d => vScale(d))
          .attr("x2", d => 800)
          .attr("y2", d => vScale(d))
          .attr("stroke", "rgba(0,0,0,0.3)"));

    grid
      .selectAll("line.vLineGrid")
      .data(hDomain)
      .join(
        enter => enter.append("line")
          .attr("class", "vLineGrid")
          .attr("x1", d => hScale(d))
          .attr("y1", d => 30)
          .attr("x2", d => hScale(d))
          .attr("y2", d => 800)
          .attr("stroke", "rgba(0,0,0,0.3)"));
  }

  drawBars(selection, wordWeight, vDomain, vScale) {
    const barplot = selection.append("g")
      .attr("class", "boxPlot")
      .attr("transform", `translate(${800 + 20}, 0)`);

    const barWidth = 15;

    // Ordena as palavras do tópico de acordo com a frequência
    wordWeight = wordWeight.sort((l, r) => l[1] - r[1]);

    // Zip com o domain para exibir os resultados alinhados com o eixo.
    const formatted = d3.zip(wordWeight, vDomain);

    barplot.selectAll("words")
      .data(formatted)
      .join(enter => {
        enter.append("rect")
          .attr("x", 0)
          .attr("y", (d, i) => vScale(d[1]) - barWidth / 2)
          .attr("height", barWidth)
          .attr("width", (d, i) => d3.max([d[0][1], 1]))
          .attr("rx", 0.2 *barWidth)
          .attr("fill", "red");

        enter.append("text")
          .attr("dominant-baseline", "middle")
          .attr("x", 0)
          .attr("y", (d, i) => vScale(d[1]))
          .attr("dx", (d, i) => i + 3)
          .attr("font-size", 0.7*barWidth)
          .html(d => d[0][0]);
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
          .attr("r", d => Math.sqrt(d[2]))
          .attr("fill", "rgba(0, 0, 0, 0.3")
          .attr("stroke", "black")
          .call(this.tooltip)
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
