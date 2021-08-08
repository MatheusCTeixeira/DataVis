import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import {MatButtonModule} from '@angular/material/button';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import { BubblesComponent } from './bubbles/bubbles.component';
import { MapComponent } from './map/map.component';
import { LogoComponent } from './logo/logo.component';
import {MatSelectModule} from '@angular/material/select';
import { ReactiveFormsModule } from '@angular/forms';
import { BarplotComponent } from './barplot/barplot.component';
import { LineplotComponent } from './lineplot/lineplot.component';
import { RadarplotComponent } from './radarplot/radarplot.component';
import { BoxplotComponent } from './boxplot/boxplot.component';
import { DatePipe, DecimalPipe, registerLocaleData } from '@angular/common';
import { LOCALE_ID } from '@angular/core';
import localePt from '@angular/common/locales/pt';
import { HeatmapComponent } from './heatmap/heatmap.component';
import { TermiteVisComponent } from './termite-vis/termite-vis.component';
import { LoadScreenComponent } from './load-screen/load-screen.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import { TutorialComponent } from './tutorial/tutorial.component';

registerLocaleData(localePt, 'pt');

@NgModule({
  declarations: [
    AppComponent,
    BubblesComponent,
    MapComponent,
    LogoComponent,
    BarplotComponent,
    LineplotComponent,
    RadarplotComponent,
    BoxplotComponent,
    HeatmapComponent,
    TermiteVisComponent,
    LoadScreenComponent,
    TutorialComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  providers: [
    DecimalPipe,
    DatePipe,
  {   provide: LOCALE_ID,
      useValue: 'pt'
  },
  ],
  bootstrap: [AppComponent]
})
export class AppModule {

 }
