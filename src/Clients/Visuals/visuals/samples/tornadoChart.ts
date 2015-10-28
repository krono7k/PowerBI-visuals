/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

/// <reference path="../../_references.ts"/>

module powerbi.visuals.samples {
    import ValueFormatter = powerbi.visuals.valueFormatter;
    import getAnimationDuration = AnimatorCommon.GetAnimationDuration;

    type D3Element = 
        D3.UpdateSelection |
        D3.Selection |
        D3.Selectors |
        D3.Transition.Transition;

    export interface TornadoChartSections {
        left: number;
        right?: number;
        isPercent: boolean;
    }

    export interface TornadoChartTextOptions {
        fontFamily?: string;
        fontSize?: number;
        sizeUnit?: string;
    }

    export interface TornadoChartConstructorOptions {
        svg?: D3.Selection;
        animator?: IGenericAnimator;
        margin?: IMargin;
        sections?: TornadoChartSections;
        maxLabelWidth?: number;
        columnPadding?: number;
    }

    export interface TornadoChartSeries {
        fill: string;
        name: string;
        values: any[];
        selectionId: SelectionId;
    }

    export interface TornadoChartSettings {
        precision: number;
        formatter?: IValueFormatter;
        showLabels?: boolean;
        showLegend?: boolean;
        showCategories?: boolean;
        labelInsideFillColour: string;
        labelOutsideFillColour: string;
        categoriesFillColour: string;
    }

    export interface TornadoChartDataView {
        displayName: string;
        categories: string[];
        series: TornadoChartSeries[];
        settings: TornadoChartSettings;
        legend: LegendData;
    }

    interface LabelData {
        x: number;
        y: number;
        dx: number;
        dy: number;
        value: number | string;
        source: number | string;
        colour: string;
        height: number;
        width: number;
    }

    interface ColumnData {
        x: number;
        y: number;
        dx: number;
        dy: number;
        px: number;
        py: number;
        angle: number;
        height: number;
        width: number;
        label: LabelData;
        color: string;
        tooltipData: TooltipDataItem[];
    }

    interface LineData {
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    }

    interface TextData {
        text: string;
        options: TornadoChartTextOptions;
        height: number;
        width: number;
        textProperties: TextProperties;
    }

    export class TornadoChart implements IVisual  {
        private static ClassName: string = "tornado-chart";

        private static Properties: any = {
            general: {
                formatString: <DataViewObjectPropertyIdentifier>{
                    objectName: "general",
                    propertyName: "formatString"
                }
            },
            labels: {
                show: <DataViewObjectPropertyIdentifier> {
                    objectName: "labels",
                    propertyName: "show"
                },
                labelPrecision: <DataViewObjectPropertyIdentifier> {
                    objectName: "labels",
                    propertyName: "labelPrecision"
                },
                insideFill: <DataViewObjectPropertyIdentifier> {
                    objectName: "labels",
                    propertyName: "insideFill"
                },
                outsideFill: <DataViewObjectPropertyIdentifier> {
                    objectName: "labels",
                    propertyName: "outsideFill"
                }
            },
            dataPoint: {
                fill: <DataViewObjectPropertyIdentifier> {
                    objectName: "dataPoint",
                    propertyName: "fill"
                }
            },
            legend: {
                show: <DataViewObjectPropertyIdentifier> {
                    objectName: "legend",
                    propertyName: "show"
                }
            },
            categories: {
                show: <DataViewObjectPropertyIdentifier> {
                    objectName: "categories",
                    propertyName: "show"
                },
                fill: <DataViewObjectPropertyIdentifier> {
                    objectName: "categories",
                    propertyName: "fill"
                }
            }
        };

        private static Columns: ClassAndSelector = {
            "class": "columns",
            selector: ".columns"
        };

        private static Column: ClassAndSelector = {
            "class": "column",
            selector: ".column"
        };

        private static Axes: ClassAndSelector = {
            "class": "axes",
            selector: ".axes"
        };

        private static Axis: ClassAndSelector = {
            "class": "axis",
            selector: ".axis"
        };

        private static Labels: ClassAndSelector = {
            "class": "labels",
            selector: ".labels"
        };

        private static Label: ClassAndSelector = {
            "class": "label",
            selector: ".label"
        };

        private static LabelTitle: ClassAndSelector = {
            "class": "label-title",
            selector: ".label-title"
        };

        private static LabelText: ClassAndSelector = {
            "class": "label-text",
            selector: ".label-text"
        };

        private static Categories: ClassAndSelector = {
            "class": "categories",
            selector: ".categories"
        };

        private static Category: ClassAndSelector = {
            "class": "category",
            selector: ".category"
        };

        private static CategoryTitle: ClassAndSelector = {
            "class": "category-title",
            selector: ".category-title"
        };

        private static CategoryText: ClassAndSelector = {
            "class": "category-text",
            selector: ".category-text"
        };

        private static Legend: ClassAndSelector = {
            "class": "legendGroup",
            selector: "#legendGroup"
        };

        public static capabilities: VisualCapabilities = {
            dataRoles: [{
                name: "Category",
                kind: VisualDataRoleKind.Grouping,
                displayName: data.createDisplayNameGetter("Role_DisplayName_Group")
            }, {
                name: "Values",
                kind: VisualDataRoleKind.Measure,
                displayName: data.createDisplayNameGetter("Role_DisplayName_Values"),
            }],
            dataViewMappings: [{
                conditions: [{
                    "Category": {
                        max: 1
                    },
                    "Values": {
                        min: 1,
                        max: 2
                    }
                }],
                categorical: {
                    categories: {
                        for: {
                            in: "Category"
                        }
                    },
                    values: {
                        select: [{ for: { in: "Values" } }]
                    }
                }
            }],
            objects: {
                general: {
                    displayName: data.createDisplayNameGetter("Visual_General"),
                    properties: {
                        formatString: {
                            type: {
                                formatting: {
                                    formatString: true
                                }
                            },
                        }
                    }
                },
                dataPoint: {
                    displayName: data.createDisplayNameGetter("Visual_DataPoint"),
                    properties: {
                        fill: {
                            displayName: data.createDisplayNameGetter('Visual_Fill'),
                            type: { fill: { solid: { color: true } } }
                        }
                    }
                },
                labels: {
                    displayName: data.createDisplayNameGetter("Visual_DataPointsLabels"),
                    properties: {
                        show: {
                            displayName: data.createDisplayNameGetter("Visual_Show"),
                            type: { bool: true }
                        },
                        labelPrecision: {
                            displayName: data.createDisplayNameGetter("Visual_Precision"),
                            type: { numeric: true }
                        },
                        insideFill: {
                            displayName: "Inside fill",
                            type: { fill: { solid: { color: true } } }
                        },
                        outsideFill: {
                            displayName: "Outside fill",
                            type: { fill: { solid: { color: true } } }
                        }
                    }
                },
                legend: {
                    displayName: data.createDisplayNameGetter("Visual_Legend"),
                    properties: {
                        show: {
                            displayName: data.createDisplayNameGetter("Visual_Show"),
                            type: { bool: true }
                        }
                    }
                },
                categories: {
                    displayName: data.createDisplayNameGetter("Role_DisplayName_Group"),
                    properties: {
                        show: {
                            displayName: data.createDisplayNameGetter("Visual_Show"),
                            type: { bool: true }
                        },
                        fill: {
                            displayName: data.createDisplayNameGetter('Visual_Fill'),
                            type: { fill: { solid: { color: true } } }
                        }
                    }
                }
            }
        };

        private DefaultTornadoChartSettings: TornadoChartSettings = {
            precision: 2,
            showCategories: true,
            showLegend: true,
            showLabels: true,
            labelInsideFillColour: "#fff",
            labelOutsideFillColour: "#777",
            categoriesFillColour: "#777"
        };

        private DefaultFillColors: string[] = [
            "purple", "teal"
        ];

        private MinPrecision: number = 0;

        private MinOpacity: number = 0;
        private MinColumnOpacity: number;
        private MaxOpacity: number = 1;

        private MaxSizeSections: number = 100;

        private MaxSeries: number = 2;

        private columnPadding: number = 10;

        private maxLabelWidth: number = 55;
        private leftLabelMargin: number = 4;
        private durationAnimations: number = 200;

        private InnerTextHeightDelta: number = 2;

        private textOptions: TornadoChartTextOptions = {};

        private sections: TornadoChartSections = {
            left: 75,
            right: 0,
            isPercent: false
        };

        private currentSections: TornadoChartSections = _.clone(this.sections);

        private margin: IMargin = {
            top: 10,
            right: 10,
            bottom: 10,
            left: 10
        };

        private element: JQuery;
        private root: D3.Selection;
        private svg: D3.Selection;
        private main: D3.Selection;
        private columns: D3.Selection;
        private axes: D3.Selection;
        private labels: D3.Selection;
        private categories: D3.Selection;

        private legend: ILegend;

        private colors: IDataColorPalette;

        private viewport: IViewport;
        private dataView: DataView;
        private tornadoChartDataView: TornadoChartDataView;

        private heightColumn: number = 0;
        private widthLeftSection: number = 0;
        private widthRightSection: number = 0;

        private isSelectColumn: boolean;

        private animator: IGenericAnimator;

        constructor(tornadoChartConstructorOptions?: TornadoChartConstructorOptions) {
            if (tornadoChartConstructorOptions) {
                this.svg = tornadoChartConstructorOptions.svg || this.svg;
                this.margin = tornadoChartConstructorOptions.margin || this.margin;
                this.sections = tornadoChartConstructorOptions.sections || this.sections;
                this.columnPadding = tornadoChartConstructorOptions.columnPadding || this.columnPadding;
                this.currentSections = _.clone(this.sections);

                if (tornadoChartConstructorOptions.animator) {
                    this.animator = tornadoChartConstructorOptions.animator;
                }
            }

            this.isSelectColumn = false;
            this.MinColumnOpacity = 0.2;
        }

        public init(visualInitOptions: VisualInitOptions): void {
            let style: IVisualStyle = visualInitOptions.style,
                fontSize: string;

            this.element = visualInitOptions.element;

            this.colors = style.colorPalette.dataColors;

            if (this.svg) {
                this.root = this.svg;
            } else {
                this.root = d3.select(this.element.get(0))
                    .append("svg");
            }

            this.root.classed(TornadoChart.ClassName, true);

            fontSize = this.root.style("font-size");

            this.textOptions.sizeUnit = fontSize.slice(fontSize.length - 2);
            this.textOptions.fontSize = Number(fontSize.slice(0, fontSize.length - 2));
            this.textOptions.fontFamily = this.root.style("font-family");

            this.main = this.root.append("g");

            this.columns = this.main
                .append("g")
                .classed(TornadoChart.Columns["class"], true);

            this.axes = this.main
                .append("g")
                .classed(TornadoChart.Axes["class"], true);

            this.labels = this.main
                .append("g")
                .classed(TornadoChart.Labels["class"], true);

            this.categories = this.main
                .append("g")
                .classed(TornadoChart.Categories["class"], true);

            this.legend = createLegend(this.element, false, null);
        }

        private getLegendElement(): D3.Selection {
            return d3.select(this.element.get(0)).select(TornadoChart.Legend.selector);
        }

        public update(visualUpdateOptions: VisualUpdateOptions): void {
            if (!visualUpdateOptions ||
                !visualUpdateOptions.dataViews ||
                !visualUpdateOptions.dataViews[0]) {
                return;
            }

            this.dataView = visualUpdateOptions.dataViews[0];

            this.durationAnimations = getAnimationDuration(
                this.animator,
                visualUpdateOptions.suppressAnimations);

            this.tornadoChartDataView = this.converter(this.dataView);
            this.setSize(visualUpdateOptions.viewport);
            this.updateSections(this.tornadoChartDataView);
            this.updateSectionsWidth();
            this.updateElements(visualUpdateOptions.viewport.height, visualUpdateOptions.viewport.width);

            this.render(this.tornadoChartDataView);
        }

        private setSize(viewport: IViewport): void {
            let height: number,
                width: number;

            height =
                viewport.height -
                this.margin.top -
                this.margin.bottom;

            width =
                viewport.width -
                this.margin.left -
                this.margin.right;

            this.viewport = {
                height: height,
                width: width
            };
        }

        private updateElements(height: number, width: number): void {
            let elementsTranslate: string = SVGUtil.translate(this.widthLeftSection, 0);

            this.root.attr({
                "height": height,
                "width": width
            });

            this.main.attr("transform", SVGUtil.translate(
                this.margin.left,
                this.margin.top
            ));

            this.columns
                .attr("transform", elementsTranslate);

            this.labels
                .attr("transform", elementsTranslate);

            this.axes
                .attr("transform", elementsTranslate);
        }

        private updateSectionsWidth(): void {
            this.widthLeftSection = this.getValueByPercent(this.currentSections.left, this.viewport.width, this.currentSections.isPercent);
            this.widthRightSection = this.getValueByPercent(this.currentSections.right, this.viewport.width, this.currentSections.isPercent);
        }

        private getValueByPercent(percent: number, maxValue: number, isPrecent: boolean = true): number {
            return isPrecent 
                ? (percent * maxValue) / 100
                : percent;
        }

        public converter(dataView: DataView): TornadoChartDataView {
            if (!dataView ||
                !dataView.categorical ||
                !dataView.categorical.categories ||
                !dataView.categorical.categories[0] ||
                !dataView.categorical.categories[0].source ||
                !dataView.categorical.values) {
                return null;
            }

            let categories: string[],
                values: DataViewValueColumn[],
                series: TornadoChartSeries[],
                displayName: string,
                objects: DataViewObjects,
                settings: TornadoChartSettings;

            values = dataView.categorical.values.slice(0, this.MaxSeries);

            categories = dataView.categorical.categories[0].values;
            displayName = dataView.categorical.categories[0].source.displayName;

            objects = this.getObjectsFromDataView(dataView);

            settings = this.parseSettings(dataView, objects, values[0].values[0]);

            series = this.parseSeries(values);

            return {
                displayName: displayName,
                categories: categories,
                series: series,
                settings: settings,
                legend: this.getLegendData(series)
            };
        }

        private parseSettings(dataView: DataView, objects: DataViewObjects, value: number): TornadoChartSettings {
            let valueFormatter: IValueFormatter,
                precision: number;

            precision = this.getPrecision(objects);

            valueFormatter = ValueFormatter.create({
                format: ValueFormatter.getFormatString(dataView.categorical.categories[0].source, TornadoChart.Properties.general.formatString),
                precision: precision,
                value: value
            });

            return {
                formatter: valueFormatter,
                precision: precision,
                showCategories: DataViewObjects.getValue(objects, TornadoChart.Properties.categories.show, this.DefaultTornadoChartSettings.showCategories),
                showLabels: DataViewObjects.getValue(objects, TornadoChart.Properties.labels.show, this.DefaultTornadoChartSettings.showLabels),
                showLegend: DataViewObjects.getValue(objects, TornadoChart.Properties.legend.show, this.DefaultTornadoChartSettings.showLegend),
                labelInsideFillColour: this.getColor(TornadoChart.Properties.labels.insideFill, this.DefaultTornadoChartSettings.labelInsideFillColour, objects),
                labelOutsideFillColour: this.getColor(TornadoChart.Properties.labels.outsideFill, this.DefaultTornadoChartSettings.labelOutsideFillColour, objects),
                categoriesFillColour: this.getColor(TornadoChart.Properties.categories.fill, this.DefaultTornadoChartSettings.categoriesFillColour, objects)
            };
        }

        private getColor(properties: any, defaultColor: string, objects: DataViewObjects): string {
            let colorHelper: ColorHelper;

            colorHelper = new ColorHelper(this.colors, properties, defaultColor);
            
            return colorHelper.getColorForMeasure(objects, "");
        }

        private getPrecision(objects: DataViewObjects): number {
            let precision: number = DataViewObjects.getValue(
                objects,
                TornadoChart.Properties.labels.labelPrecision,
                this.DefaultTornadoChartSettings.precision);

            if (precision <= this.MinPrecision) {
                return this.MinPrecision;
            }

            return precision;
        }

        private getObjectsFromDataView(dataView: DataView): DataViewObjects {
            if (!dataView ||
                !dataView.metadata ||
                !dataView.metadata.columns ||
                !dataView.metadata.objects) {
                    return null;
                }

            return dataView.metadata.objects;
        }

        private parseSeries(dataViewValueColumn: DataViewValueColumn[]): TornadoChartSeries[] {
            return dataViewValueColumn.map((dataViewValueColumn: DataViewValueColumn, index: number) => {
                let colour: string;

                colour = this.getColor(
                    TornadoChart.Properties.dataPoint.fill,
                    this.DefaultFillColors[index],
                    dataViewValueColumn.source.objects);

                return <TornadoChartSeries> {
                    fill: colour,
                    name: dataViewValueColumn.source.displayName,
                    values: dataViewValueColumn.values,
                    selectionId: SelectionId.createWithMeasure(dataViewValueColumn.source.queryName)
                };
            });
        }

        private getLegendData(series: TornadoChartSeries[]): LegendData {
            let legendDataPoints: LegendDataPoint[];

            legendDataPoints = series.map((item: TornadoChartSeries) => {
                return <LegendDataPoint> {
                    label: item.name,
                    color: item.fill,
                    icon: LegendIcon.Box,
                    selected: false,
                    identity: null
                };
            });

            return {
                dataPoints: legendDataPoints
            };
        }

        private updateSections(dataView: TornadoChartDataView): void {
            if (!dataView ||
                !dataView.settings) {
                return;
            }

            let settings: TornadoChartSettings = dataView.settings;

            this.currentSections.left = settings.showCategories
                ? this.sections.left
                : 0;

            this.currentSections.right = this.currentSections.isPercent
                ? this.MaxSizeSections - this.currentSections.left
                : this.viewport.width - this.currentSections.left;
        }

        private render(tornadoChartDataView: TornadoChartDataView): void {
            if (!tornadoChartDataView ||
                !tornadoChartDataView.settings) {
                return;
            }

            this.renderLegend(tornadoChartDataView);

            this.updateViewportHeight();
            this.computeHeightColumn(tornadoChartDataView);

            this.renderMiddleSection(tornadoChartDataView);
            this.renderAxes(tornadoChartDataView);
            this.renderCategories(tornadoChartDataView);
        }

        private updateViewportHeight(): void {
            this.viewport.height -= this.legend.getMargins().height;
        }

        private computeHeightColumn(tornadoChartDataView: TornadoChartDataView): void {
            let length: number = tornadoChartDataView.categories.length;

            this.heightColumn = (this.viewport.height - (length - 1) * this.columnPadding) / length;
        }

        private renderMiddleSection(tornadoChartDataView: TornadoChartDataView): void {
            let columnsData: ColumnData[] = this.generateColumnDataBySeries(tornadoChartDataView);

            this.renderColumns(columnsData, tornadoChartDataView.series.length === 2);
            this.renderLabels(columnsData, tornadoChartDataView.settings);
        }

        private renderColumns(columnsData: ColumnData[], selectSecondSeries: boolean = false): void {
            let self: TornadoChart = this,
                columnsSelectionAnimation: D3.UpdateSelection,
                columnsSelection: D3.UpdateSelection,
                columnElements: D3.Selection = this.main
                    .select(TornadoChart.Columns.selector)
                    .selectAll(TornadoChart.Column.selector);

            columnsSelection = columnElements.data(columnsData);

            columnsSelection
                .enter()
                .append("svg:rect");

            columnsSelection
                .attr("x", (item: ColumnData) => item.x)
                .attr("y", (item: ColumnData) => item.y)
                .on("click", (item: ColumnData, index: number) => {
                    this.setSelection(index, columnsSelection, selectSecondSeries);

                    this.isSelectColumn = true;
                    d3.event.stopPropagation();
                });

            (columnElements[0] && columnElements[0].length === columnsData.length
                ? <D3.UpdateSelection> this.animation(columnsSelection)
                : columnsSelection)
                .attr("width", (item: ColumnData) => item.width)
                .attr("height", (item: ColumnData) => item.height)
                .attr("fill", (item: ColumnData) => item.color)
                .attr("transform", (item: ColumnData) => SVGUtil.translateAndRotate(item.dx, item.dy, item.px, item.py, item.angle));

            columnsSelection.classed(TornadoChart.Column["class"], true);

            columnsSelection
                .exit()
                .remove();

            this.renderTooltip(columnsSelection);

            d3.selection().on("click", () => {
                if (self.isSelectColumn) {
                    let columnsElements: D3.Selection = this.main
                        .select(TornadoChart.Columns.selector)
                        .selectAll(TornadoChart.Column.selector);

                    this.setOpacity(columnsElements, self.MaxOpacity, true);

                    self.isSelectColumn = false;
                }
            });
        }

        private setSelection(
            currentIndexOfColumn: number,
            columns: D3.UpdateSelection,
            selectSecondSeries: boolean = false): void {
            let columnElements = columns[0],
                quantityOfColumns: number = columnElements.length,
                shift: number = Math.floor(quantityOfColumns / 2),
                index: number = currentIndexOfColumn;

            if (selectSecondSeries) {
                index = currentIndexOfColumn < shift
                    ? currentIndexOfColumn + shift
                    : currentIndexOfColumn - shift;
            }

            this.setOpacity(columns.filter((item: any) => {
                return item !== columnElements[index] || item !== columnElements[currentIndexOfColumn];
            }), this.MinColumnOpacity);

            this.setOpacity(d3.select(columnElements[currentIndexOfColumn]), this.MaxOpacity);

            if (selectSecondSeries) {
                this.setOpacity(d3.select(columnElements[index]), this.MaxOpacity);
            }
        }

        private renderTooltip(selection: D3.UpdateSelection): void {
            TooltipManager.addTooltip(selection, (tooltipEvent: TooltipEvent) => {
               return (<ColumnData> tooltipEvent.data).tooltipData;
            });
        }

        private generateColumnDataBySeries(tornadoChartDataView: TornadoChartDataView): ColumnData[] {
            let categories: string[] = tornadoChartDataView.categories,
                series: TornadoChartSeries[] = tornadoChartDataView.series,
                settings: TornadoChartSettings = tornadoChartDataView.settings,
                displayName: string = tornadoChartDataView.displayName,
                valueFormatter: IValueFormatter = settings.formatter,
                width: number,
                minValue: number,
                maxValue: number;

            width = this.widthRightSection;

            if (series.length === 0) {
                return [];
            }

            minValue = Math.min(d3.min(series[0].values), 0);
            maxValue = d3.max(series[0].values);

            if (series.length === this.MaxSeries) {
                minValue = d3.min([minValue, d3.min(series[1].values)]);
                maxValue = d3.max([maxValue, d3.max(series[1].values)]);

                width = width / this.MaxSeries;
            }

            return series.reduce((previousValue: ColumnData[], currentValue: TornadoChartSeries, index: number) => {
                let shiftToMiddle: boolean = index === 0 && series.length === this.MaxSeries,
                    shiftToRight: boolean = index === 1,
                    seriesName: string = currentValue.name;

                return previousValue.concat(
                    this.generateColumnDataByValues(
                        currentValue,
                        minValue,
                        maxValue,
                        width,
                        shiftToRight,
                        shiftToMiddle,
                        valueFormatter,
                        categories,
                        seriesName,
                        displayName,
                        settings.labelInsideFillColour,
                        settings.labelOutsideFillColour));
            }, []);
        }

        private generateColumnDataByValues(
            tornadoChartSeries: TornadoChartSeries,
            minValue: number,
            maxValue: number,
            maxWidth: number,
            shiftToRight: boolean,
            shiftToMiddle: boolean,
            valueFormatter: IValueFormatter,
            categories: string[],
            seriesName: string,
            displayName: string,
            labelInsideFillColour: string,
            labelOutsideFillColour: string): ColumnData[] {
            return tornadoChartSeries.values.map((value: number, index: number) => {
                let categoryValue: string = categories[index];

                return this.generateColumnData(
                    value,
                    minValue,
                    maxValue,
                    maxWidth,
                    shiftToMiddle,
                    shiftToRight,
                    tornadoChartSeries.fill,
                    index,
                    valueFormatter,
                    categoryValue,
                    seriesName,
                    displayName,
                    labelInsideFillColour,
                    labelOutsideFillColour);
            });
        }

        private generateColumnData(
            value: number,
            minValue: number,
            maxValue: number,
            width: number,
            shiftToMiddle: boolean,
            shiftToRight: boolean,
            color: string,
            index: number,
            valueFormatter: IValueFormatter,
            categoryValue: string,
            seriesName: string,
            displayName: string,
            labelInsideFillColour: string,
            labelOutsideFillColour: string): ColumnData {
            let x: number = 0,
                y: number = 0,
                widthOfColumn: number,
                shift: number = 0,
                dy: number,
                dx: number,
                label: LabelData,
                angle: number = 0;

            widthOfColumn = this.getColumnWidth(value, minValue, maxValue, width);
            shift = width - widthOfColumn;

            dx = shift * Number(shiftToMiddle) + width * Number(shiftToRight); 
            dy = (this.heightColumn + this.columnPadding) * index;

            label = this.getLabelData(
                value,
                x,
                y,
                dx,
                dy,
                widthOfColumn,
                shiftToMiddle,
                valueFormatter,
                labelInsideFillColour,
                labelOutsideFillColour);

            if (shiftToMiddle) {
                angle = 180;
            }

            return {
                x: x,
                y: y,
                dx: dx,
                dy: dy,
                px: widthOfColumn / 2,
                py: this.heightColumn / 2, 
                angle: angle,
                width: widthOfColumn,
                height: this.heightColumn,
                label: label,
                color: color,
                tooltipData: this.getTooltipData(displayName, categoryValue, seriesName, label.value.toString())
            };
        }

        private getColumnWidth(value: number, minValue: number, maxValue: number, width: number): number {
            if (minValue === maxValue) {
                return width;
            }

            return width * (value - minValue) / (maxValue - minValue);
        }

        private getLabelData(
            value: number,
            xColumn: number,
            yColumn: number,
            dxColumn: number,
            dyColumn: number,
            columnWidth: number,
            isColumnPositionLeft: boolean,
            valueFormatter: IValueFormatter,
            labelInsideFillColour: string,
            labelOutsideFillColour: string): LabelData {
            let dx: number,
                colour: string = labelInsideFillColour,
                valueAfterValueFormatter: string,
                textData: TextData = this.getTextData(valueFormatter.format(value), false, true),
                textDataAfterValueFormatter: TextData;

            valueAfterValueFormatter = TextMeasurementService.getTailoredTextOrDefault(textData.textProperties, this.maxLabelWidth);
            textDataAfterValueFormatter = this.getTextData(valueAfterValueFormatter, true);

            if (columnWidth > textDataAfterValueFormatter.width) {
                dx = dxColumn + columnWidth / 2 - textDataAfterValueFormatter.width / 2;
            } else {
                if (isColumnPositionLeft) {
                    dx = dxColumn - this.leftLabelMargin - textDataAfterValueFormatter.width;
                } else {
                    dx = dxColumn + columnWidth + this.leftLabelMargin;
                }

                colour = labelOutsideFillColour;
            }

            return {
                x: xColumn,
                y: yColumn,
                dx: dx,
                dy: dyColumn + this.heightColumn / 2 + textData.height / 2 - this.InnerTextHeightDelta,
                source: value,
                value: valueAfterValueFormatter,
                colour: colour,
                height: textData.height,
                width: textDataAfterValueFormatter.width
            };
        }

        private getTooltipData(displayName: string, categoryValue: string, seriesName, value: string): TooltipDataItem[] {
             return [{
                displayName: displayName,
                value: categoryValue
            }, {
                displayName: seriesName,
                value: value
            }];
        }

        private renderAxes(tornadoChartDataView: TornadoChartDataView): void {
            let linesData: LineData[],
                axesSelection: D3.UpdateSelection,
                axesElements: D3.Selection = this.main
                    .select(TornadoChart.Axes.selector)
                    .selectAll(TornadoChart.Axis.selector);

            if (tornadoChartDataView.series.length !== this.MaxSeries) {
                axesElements.remove();

                return;
            }

            linesData = this.generateAxesData();

            axesSelection = axesElements.data(linesData);

            axesSelection
                .enter()
                .append("svg:line")
                .classed(TornadoChart.Axis["class"], true);

            (<D3.UpdateSelection> this.animation(axesSelection))
                .attr("x1", (item: LineData) => item.x1)
                .attr("y1", (item: LineData) => item.y1)
                .attr("x2", (item: LineData) => item.x2)
                .attr("y2", (item: LineData) => item.y2);

            axesSelection
                .exit()
                .remove();
        }

        private generateAxesData(): LineData[] {
            let x: number,
                y1: number,
                y2: number;

            x = this.widthRightSection / 2;
            y1 = 0;
            y2 = this.viewport.height;

            return [{
                x1: x,
                y1: y1,
                x2: x,
                y2: y2
            }];
        }

        private renderLabels(columnsData: ColumnData[], settings: TornadoChartSettings): void {
            let height: number = 0,
                labelEnterSelection: D3.Selection,
                labelSelection: D3.UpdateSelection,
                labelSelectionAnimation: D3.UpdateSelection,
                labelElements: D3.Selection = this.main
                    .select(TornadoChart.Labels.selector)
                    .selectAll(TornadoChart.Label.selector);

            if (columnsData[0] &&
                columnsData[0].label) {
                height = columnsData[0].label.height;
            }

            labelSelection = labelElements.data(columnsData);

            labelEnterSelection = labelSelection
                .enter()
                .append("g");

            labelEnterSelection
                .append("svg:title")
                .classed(TornadoChart.LabelTitle["class"], true);

            labelEnterSelection
                .append("svg:text")
                .classed(TornadoChart.LabelText["class"], true);

            labelSelection
                .attr("x", (item: ColumnData) => item.label.x)
                .attr("y", (item: ColumnData) => item.label.y)
                .attr("display", (item: ColumnData) => {
                    let leftBorder: number = 0,
                        rightBorder: number = this.currentSections.right,
                        x: number = item.label.x + item.label.dx;

                    if (leftBorder < x &&
                        rightBorder > x + item.label.width) {
                        return null;
                    } else {
                        return "none";
                    }
                })
                .classed(TornadoChart.Label["class"], true);

            labelSelection
                .select(TornadoChart.LabelTitle.selector)
                .text((item: ColumnData) => item.label.source);

            labelSelectionAnimation = labelElements[0] && labelElements[0].length === columnsData.length
                ? (<D3.UpdateSelection> this.animation(labelSelection))
                : labelSelection;

            labelSelectionAnimation
                .attr("transform", (item: ColumnData) => SVGUtil.translate(item.label.dx, item.label.dy));

            (<D3.UpdateSelection> this.animation(labelSelection
                .select(TornadoChart.LabelText.selector)))
                .attr("fill", (item: ColumnData) => item.label.colour)
                .text((item: ColumnData) => item.label.value);

            if (!settings.showLabels || height > this.heightColumn) {
                this.setOpacity(labelSelectionAnimation);
            } else {
                this.setOpacity(labelSelectionAnimation, this.MaxOpacity);
            }

            labelSelection
                .exit()
                .remove();
        }

        private renderCategories(tornadoChartDataView: TornadoChartDataView): void {
            let settings: TornadoChartSettings = tornadoChartDataView.settings,
                colour: string = settings.categoriesFillColour,
                categoriesEnterSelection: D3.Selection,
                categoriesSelection: D3.UpdateSelection,
                categoryElements: D3.Selection = this.main
                    .select(TornadoChart.Categories.selector)
                    .selectAll(TornadoChart.Category.selector),
                self: TornadoChart = this;

            if (!settings.showCategories) {
                categoryElements.remove();

                return;
            }

            categoriesSelection = categoryElements.data(tornadoChartDataView.categories);

            categoriesEnterSelection = categoriesSelection
                .enter()
                .append("g");

            categoriesEnterSelection
                .append("svg:title")
                .classed(TornadoChart.CategoryTitle["class"], true);

            categoriesEnterSelection
                .append("svg:text")
                .classed(TornadoChart.CategoryText["class"], true);

            categoriesSelection
                .attr("x", 0)
                .attr("y", 0)
                .attr("transform", (item: string, index: number) => {
                    let shift: number = (this.heightColumn + this.columnPadding) * index + this.heightColumn / 2,
                        textData: TextData = this.getTextData(item, false, true);

                    shift = shift + textData.height / 2 - this.InnerTextHeightDelta;

                    return SVGUtil.translate(0, shift);
                })
                .classed(TornadoChart.Category["class"], true);

            categoriesSelection
                .select(TornadoChart.CategoryTitle.selector)
                .text((item: string) => item);

            categoriesSelection
                .select(TornadoChart.CategoryText.selector)
                .attr("fill", colour)
                .text((item: string) => {
                    let textData: TextData = self.getTextData(item);

                    return TextMeasurementService.getTailoredTextOrDefault(textData.textProperties, self.widthLeftSection);
                });

            categoriesSelection
                .exit()
                .remove();
        }

        private renderLegend(tornadoChartDataView: TornadoChartDataView): void {
            if (!tornadoChartDataView.legend) {
                return;
            }

            if (tornadoChartDataView.settings.showLegend) {
                this.legend.changeOrientation(LegendPosition.Top);
            } else {
                this.legend.changeOrientation(LegendPosition.None);
            }

            this.legend.drawLegend(tornadoChartDataView.legend, this.viewport);

            this.getLegendElement().attr("transform", SVGUtil.translate(
                this.margin.left,
                0
            ));
        }

        private getTextData(text: string, measureWidth: boolean = false, measureHeight: boolean = false): TextData {
            let width: number = 0,
                height: number = 0,
                textProperties: TextProperties;

            text = text || "";

            textProperties = {
                text: text,
                fontFamily: this.textOptions.fontFamily,
                fontSize: `${this.textOptions.fontSize}${this.textOptions.sizeUnit}`
            };

            if (measureWidth) {
                width = TextMeasurementService.measureSvgTextWidth(textProperties);
            }

            if (measureHeight) {
                height = TextMeasurementService.measureSvgTextHeight(textProperties);
            }

            return {
                text: text,
                options: this.textOptions,
                width: width,
                height: height,
                textProperties: textProperties
            };
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            let enumeration = new ObjectEnumerationBuilder(),
                settings: TornadoChartSettings;

            if (!this.tornadoChartDataView ||
                !this.tornadoChartDataView.settings) {
                return [];
            }

            settings = this.tornadoChartDataView.settings;

            switch (options.objectName) {
                case "dataPoint": {
                    this.enumerateDataPoint(enumeration);

                    break;
                }
                case "labels": {
                    let labels: VisualObjectInstance = {
                        objectName: "labels",
                        displayName: "labels",
                        selector: null,
                        properties: {
                            show: settings.showLabels,
                            labelPrecision: settings.precision,
                            insideFill: settings.labelInsideFillColour,
                            outsideFill: settings.labelOutsideFillColour
                        }
                    };

                    enumeration.pushInstance(labels);
                    break;
                }
                case "legend": {
                    let legend: VisualObjectInstance = {
                        objectName: "legend",
                        displayName: "legend",
                        selector: null,
                        properties: {
                            show: settings.showLegend
                        }
                    };

                    enumeration.pushInstance(legend);
                    break;
                }
                case "categories": {
                    let categories: VisualObjectInstance = {
                        objectName: "categories",
                        displayName: "categories",
                        selector: null,
                        properties: {
                            show: settings.showCategories,
                            fill: settings.categoriesFillColour
                        }
                    };

                    enumeration.pushInstance(categories);
                    break;
                }
            }

            return enumeration.complete();
        }

        private enumerateDataPoint(enumeration: ObjectEnumerationBuilder): void {
            if (!this.tornadoChartDataView ||
                !this.tornadoChartDataView.series) {
                return;
            }

            let series: TornadoChartSeries[] = this.tornadoChartDataView.series;

            series.forEach((item: TornadoChartSeries) => {
                enumeration.pushInstance({
                    objectName: "dataPoint",
                    displayName: item.name,
                    selector: ColorHelper.normalizeSelector(item.selectionId.getSelector(), false),
                    properties: {
                        fill: { solid: { color: item.fill } }
                    }
                });
            });
        }

        private setOpacity(element: D3Element, opacityValue: number = this.MinOpacity, disableAnimation: boolean = false): D3Element {
            let elementAnimation: D3.Selection = disableAnimation
                ? <D3.Selection> element
                : <D3.Selection> this.animation(element);

            return elementAnimation.style(
                "fill-opacity",
                opacityValue);
        }

        private animation(element: D3Element): D3Element {
            if (!this.durationAnimations) {
                return element;
            }

            return (<D3.Selection> element)
                .transition()
                .duration(this.durationAnimations);
        }

        public destroy(): void {
            this.root = null;
        }
    }
}