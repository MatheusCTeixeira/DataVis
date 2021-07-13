import { Component } from '@angular/core';
import * as d3 from "d3";
import { BarData, BarSeries } from './types/bardata';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  show = false;
  sexWeekLoaded = false;
  sexWeek= [new BarSeries("Masc.").addStyle({fillColor: "blue"}),
            new BarSeries("Fem.").addStyle({fillColor: "red"}),
            new BarSeries("Desc.").addStyle({fillColor: "lightgray"})];

  constructor() {

  }

  ngOnInit() {
    this.loadSexWeek();
  }

  loadSexWeek() {
    d3.csv("assets/sex_weeks.csv")
    .then((rows: any[]) => {
      rows = <{week_no: number; m: number; f: number; unknown: number}[]>(<unknown>rows);
      for (let row of rows) {
        this.sexWeek[0].series.push({x: +row.week_no, y: +row.m});
        this.sexWeek[1].series.push({x: +row.week_no, y: +row.f});
        this.sexWeek[2].series.push({x: +row.week_no, y: +row.unknown});
      }

      setInterval(() => this.sexWeekLoaded = true, 500);
    });
  }


}
