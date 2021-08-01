import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-load-screen',
  templateUrl: './load-screen.component.html',
  styleUrls: ['./load-screen.component.scss']
})
export class LoadScreenComponent implements OnInit {

  constructor() { }

  @Input()
  width: number;

  @Input()
  height: number;

  @Input()
  show: boolean;

  ngOnInit(): void {
  }

}
