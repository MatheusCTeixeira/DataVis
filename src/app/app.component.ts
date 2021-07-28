import { Component } from '@angular/core';
import * as d3 from "d3";
import { BarData, BarSeries } from './types/bardata';

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


    // estado, polaridade da semana; a favor vs. contra
  usersPolarity: {key: string, values: [number, number][]}[] = [
    {key: "DF", values: []},
    {key: "PE", values: []},
    {key: "SC", values: []},
    {key: "RJ", values: []},
    {key: "AL", values: []},
    {key: "GO", values: []},
    {key: "BA", values: []},
    {key: "AC", values: []},
    {key: "PR", values: []},
    {key: "MA", values: []},
    {key: "RS", values: []},
    {key: "CE", values: []},
    {key: "PB", values: []},
    {key: "PA", values: []},
    {key: "RN", values: []},
    {key: "SP", values: []},
    {key: "PI", values: []},
    {key: "MG", values: []},
    {key: "TO", values: []},
    {key: "AM", values: []},
    {key: "AP", values: []},
    {key: "MT", values: []},
    {key: "ES", values: []},
    {key: "MS", values: []},
    {key: "RO", values: []},
    {key: "SE", values: []},
    {key: "RR", values: []},
  ]

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
        for (let i = 0; i < this.usersPolarity.length; ++i) {
          const state = this.usersPolarity[i].key;
          this.usersPolarity[i].values.push(<[number, number]>[+row[state], 0]);
        }
      }
    });

    d3.csv("assets/users_loc_con.csv").then(rows => {
      let week = 0;
      const index_con = 1;
      for (let row of rows) {
        for (let i = 0; i < this.usersPolarity.length; ++i) {
          const state = this.usersPolarity[i].key;
          this.usersPolarity[i].values[week][index_con] = +row[state];
        }
        week += 1;
      }
    });
  }


}
