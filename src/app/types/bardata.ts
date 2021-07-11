import { Style } from "./style";

export class BarData {
    x: number;
    y: number;
}

export class BarSeries {
    constructor(label: string) {
        this.label = label;
        this.style = new Style();
        this.series = new Array<BarData>();
    }

    addStyle(style: Style) {
        this.style = style;
        return this;
    }

    label: string;
    style: Style;
    series: BarData[];

}