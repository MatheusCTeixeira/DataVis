import { Component, OnInit } from '@angular/core';
import * as d3 from "d3";

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss']
})
export class LogoComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    setTimeout(
      () => this.setTextAnimation(0.3, 5.0, 2, 'linear', '#fff', false), 3E2);
  }

  setTextAnimation(delay, duration, strokeWidth, timingFunction, strokeColor,repeat) {
    let mode=repeat?'infinite':'forwards';
    const length = 20;
    const func = function (d, i){ return `${(<SVGPathElement>this).getTotalLength()}px`; };
    d3.select("#logo")
      .selectAll("path")
        .style("stroke-dashoffset", func)
        .style("stroke-dasharray", func)
        .style("stroke-width", `${strokeWidth}px`)
        .style("stroke", `${strokeColor}`)
        .style("animation", `${duration}s svg-text-anim ${mode} ${timingFunction}`)
        .style("animation-delay", (d, i) => `${i * delay}s`);

}

}
