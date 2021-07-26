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

  tweetsCoords = null;
  userLocs = null;
  bots = null;
  tweetsCountsLegend = ["à favor", "contra", "bot"];
  tweetsCounts: [number, number][][] = [[], [], []]; // fav, con, bot

  tweetsCountsNormLegend = ["à favor", "contra", "bot"];
  tweetsCountsNorm: [number, number][][] = [[], [], []]; // fav, con, bot
  usersCounts: [number, number][][] = [[], [], []]; // fav, con, bot

  tweetsByDay: {label?: string, style?: {boxColor?: any}, data: [number, number][]}[] = [
    {label: "Seg", style: {boxColor: "black"}, data: []},
    {label: "Ter", style: {boxColor: "black"}, data: []},
    {label: "Qua", style: {boxColor: "black"}, data: []},
    {label: "Qui", style: {boxColor: "black"}, data: []},
    {label: "Sex", style: {boxColor: "black"}, data: []},
    {label: "Sáb", style: {boxColor: "black"}, data: []},
    {label: "Dom", style: {boxColor: "black"}, data: []}]

  coordsAndLocsLoaded = false;

  constructor() {

  }

  ngOnInit() {
    this.loadSexWeek();
    this.loadCoordsAndLocations();
    this.loadBotsHeatmap();
    this.loadTweetsCounts();
    this.loadTweetsDays();
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

      setTimeout(() => this.sexWeekLoaded = true, 500);
    });
  }

  loadCoordsAndLocations() {
    d3.csv("assets/tweets_coords.csv").then(coords => this.tweetsCoords = coords);
    d3.csv("assets/tweets_locs.csv").then(locs => this.userLocs = locs);
    setTimeout(()=> this.coordsAndLocsLoaded = true, 500);
  }

  loadBotsHeatmap() {
    d3.csv("assets/bots_heatmap.csv").then(bots => this.bots = bots);
  }

  loadTweetsCounts() {
    d3.csv("assets/tweets.csv").then(rows => {
      for (let row of rows) {
          const week = +row.week;
          this.tweetsCounts[0].push([week, +row.fav]);
          this.tweetsCounts[1].push([week, +row.con]);
          this.tweetsCounts[2].push([week, +row.bot]);

          this.tweetsCountsNorm[0].push([week, +row.fav_norm]);
          this.tweetsCountsNorm[1].push([week, +row.con_norm]);
          this.tweetsCountsNorm[2].push([week, +row.bot_norm]);

          this.usersCounts[0].push([week, +row.fav_users]);
          this.usersCounts[1].push([week, +row.con_users]);
          this.usersCounts[2].push([week, +row.bot_users]);
      }
    });
  }

  loadTweetsDays() {
    d3.csv("assets/daily_tweets.csv").then(rows => {
      for (let row of rows) {
        const week = +row.week;
        this.tweetsByDay[0].data.push([week, +row._0])
        this.tweetsByDay[1].data.push([week, +row._1])
        this.tweetsByDay[2].data.push([week, +row._2])
        this.tweetsByDay[3].data.push([week, +row._3])
        this.tweetsByDay[4].data.push([week, +row._4])
        this.tweetsByDay[5].data.push([week, +row._5])
        this.tweetsByDay[6].data.push([week, +row._6])
      }
    });
  }


}
