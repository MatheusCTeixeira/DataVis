import { Component } from '@angular/core';
import * as d3 from "d3";
import { BarData, BarSeries } from './types/bardata';
import { Polarities } from './types/polaritiries';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent { //                          x        y0       yf
  sexWeek: {keys: string[], colors: string[], values: [string, number, number][][]} = {
    keys: ["Masc.", "Fem.", "Desc."],
    colors: ["blue", "red", "gray"],
    values: []
  }

  tweetsCoords = null;
  userLocs = null;
  bots = null;
  tweetsCountsLegend = ["A Favor", "Contra", "Bot"];
  tweetsCounts: [number, number][][] = [[], [], []]; // fav, con, bot
  tweetsCountColor = ["green", "red", "grey"]
  tweetsCountsNormLegend = ["A Favor", "Contra", "Bot"];
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


    // estado, polaridade da semana; a favor vs. contra
  usersPolarity: Polarities[] = [];

  coordsAndLocsLoaded = false;

  constructor() {

  }

  ngOnInit() {
    this.loadSexWeek();
    this.loadCoordsAndLocations();
    this.loadBotsHeatmap();
    this.loadTweetsCounts();
    this.loadTweetsDays();
    this.loadUsersLocs();
  }

  loadSexWeek() {
    d3.csv("assets/sex_weeks.csv").then((rows: any[]) => {
      for (let row of rows) {
        let Yf = d3.cumsum([+row.m, +row.f, +row.unknown]);
        let Y0 = [0, +row.m, +row.f + +row.m];

        let buffer: [string, number, number][] = [];
        for (let i = 0; i < 3; ++i)
          buffer.push(<[string, number, number]>[row.week, Y0[i], Yf[i]]);

        this.sexWeek.values.push(buffer);
      }
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

  loadUsersLocs() {
    d3.csv("assets/users_loc_fav.csv").then(rows => {
      for (let row of rows) {
        let polarities = <Polarities>{};
        const week = row.week;
        delete row["week"];

        for (let state in row)
          polarities[state] = [+row[state], 0];

        this.usersPolarity.push(polarities);
      }
    });

    d3.csv("assets/users_loc_con.csv").then(rows => {
      for (let row of rows) {
        const week = +row.week;
        delete row["week"];

        for (const key in row)
          this.usersPolarity[week - 1][key][1] = +row[key]

    }});

    console.log(this.usersPolarity);
  }


}
