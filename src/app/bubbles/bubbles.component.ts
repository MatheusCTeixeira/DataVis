import { Component, OnInit } from '@angular/core';
import  * as d3 from 'd3';
import * as d3T from 'd3-transition';
import * as d3S from 'd3-selection';



@Component({
  selector: 'app-bubbles',
  templateUrl: './bubbles.component.html',
  styleUrls: ['./bubbles.component.scss']
})
export class BubblesComponent implements OnInit {

  data: any = []
  svg: any;
  transition: any;
  n: number = 20;
  speed: number = 2000;
  constructor() { }

  ngOnInit() {
    this.svg = d3.select("svg")
          .attr("width", "100%")
          .attr("height", 700);

    // this.drawMore();

  }

  drawMore() {
    this.randomPoints(this.n, 30, 800);
    this.draw();

  }

  increaseSpeed() {
    this.speed = Math.max(this.speed - 500, 1);
  }

  decreaseSpeed() {
    this.speed = Math.min(this.speed + 500, 4000);
  }


  moreParticles() {
    this.n = Math.min(this.n + 5, 120);
  }

  lessParticles() {
    this.n = Math.max(this.n - 5, 1);
  }

  draw() {
      this.svg.selectAll("circle")
      .data(this.data, function (d) {
        console.log(d.id);
        return `${d.id}`;})
      .join(
        (enter: any) => enter.append("circle")
          .attr("cx", (d: any) => d.x)
          .attr("cy", (d: any) => d.y)
          .attr("r", 5)
          .attr("id", (d: any) => d.id)
          .attr("fill", "rgb(0, 0, 0)"),
        (update:any) => update
        .call(update => update.transition(d3T.transition().duration(this.speed).ease(d3.easeQuadIn))
          .attr("cx", (d: any) => d.x)
          .attr("cy", (d: any) => d.y)
          .attr("r", (d: any) => 5 * Math.exp(-0.5*d.depth))
          .attr("fill", (d: any) => `rgb(0, 0, 0, ${d.depth})`)),
        (exit:any) => exit.remove()
      );

      setTimeout(() => this.drawMore(), this.speed);
  }

  randomPoints(n: number, from: number, to: number) {
    this.data = [];

    for (let i = 0; i < n; ++i) {
      this.data.push(this.randomPoint(i, from, to));
    }

  }

  randomPoint(key: number, from: number, to: number) {
    let obj: any = {};
    obj.x = Math.random() * (to - from) + from;
    obj.y = Math.random() * (to - from) + from;
    obj.id = `${key}`;
    obj.depth = Math.random();
    return obj;
  }



}
