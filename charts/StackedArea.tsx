import * as React from 'react'
import {sortBy, reverse, clone, last, guid, pointsToPath, formatYear} from './Util'
import {computed, action, observable} from 'mobx'
import {observer} from 'mobx-react'
import { ChartConfig } from './ChartConfig'
import { Bounds } from './Bounds'
import { AxisBox } from './AxisBox'
import { StandardAxisBoxView } from './StandardAxisBoxView'
import {getRelativeMouse, makeSafeForCSS} from './Util'
import { HeightedLegend, HeightedLegendView } from './HeightedLegend'
import { NoData } from './NoData'
import { Tooltip } from './Tooltip'
import {select} from 'd3-selection'
import {easeLinear} from 'd3-ease'
import {rgb} from 'd3-color'
import { ChartViewContext, ChartViewContextType } from './ChartViewContext'

export interface StackedAreaValue {
    x: number,
    y: number,
    origY?: number,
    time: number,
    isFake?: true
}

export interface StackedAreaSeries {
    key: string,
    color: string,
    values: StackedAreaValue[],
    classed?: string,
    isProjection?: boolean,
}

interface AreasProps extends React.SVGAttributes<SVGGElement> {
    axisBox: AxisBox
    data: StackedAreaSeries[]
    onHover: (hoverIndex: number|undefined) => void
}

@observer
export class Areas extends React.Component<AreasProps> {
    base: React.RefObject<SVGGElement> = React.createRef()

    @observable hoverIndex?: number

    @action.bound onMouseMove(ev: React.MouseEvent<SVGGElement>) {
        const {axisBox, data} = this.props

        const mouse = getRelativeMouse(this.base.current, ev.nativeEvent)

        if (axisBox.innerBounds.contains(mouse)) {
            const closestPoint = sortBy(data[0].values, d => Math.abs(axisBox.xScale.place(d.x) - mouse.x))[0]
            const index = data[0].values.indexOf(closestPoint)
            this.hoverIndex = index
        } else {
            this.hoverIndex = undefined
        }

        this.props.onHover(this.hoverIndex)
    }

    @computed get areas(): JSX.Element[] {
        const {axisBox, data} = this.props
        const {xScale, yScale} = axisBox
        const xBottomLeft = [xScale.range[0], yScale.range[0]]
        const xBottomRight = [xScale.range[1], yScale.range[0]]

        // Stacked area chart stacks each series upon the previous series, so we must keep track of the last point set we used
        let prevPoints = [xBottomLeft, xBottomRight]
        return data.map(series => {
            const mainPoints = series.values.map(v => [xScale.place(v.x), yScale.place(v.y)] as [number, number])
            const points = mainPoints.concat(reverse(clone(prevPoints)) as any)
            prevPoints = mainPoints

            return <path
                className={makeSafeForCSS(series.key)+'-area'}
                key={series.key+'-area'}
                strokeLinecap="round"
                d={pointsToPath(points)}
                fill={series.color}
                fillOpacity={0.7}
                clipPath={this.props.clipPath}
            />
        })
    }

    @computed get borders(): JSX.Element[] {
        const {axisBox, data} = this.props
        const {xScale, yScale} = axisBox

        // Stacked area chart stacks each series upon the previous series, so we must keep track of the last point set we used
        return data.map(series => {
            const points = series.values.map(v => [xScale.place(v.x), yScale.place(v.y)] as [number, number])

            return <path
                className={makeSafeForCSS(series.key)+'-border'}
                key={series.key+'-border'}
                strokeLinecap="round"
                d={pointsToPath(points)}
                stroke={rgb(series.color).darker(0.5).toString()}
                strokeOpacity={0.7}
                strokeWidth={0.5}
                fill="none"
                clipPath={this.props.clipPath}
            />
        })
    }

    render() {
        const {axisBox, data} = this.props
        const {xScale, yScale} = axisBox
        const {hoverIndex} = this

        return <g ref={this.base} className="Areas" onMouseMove={this.onMouseMove} onMouseLeave={this.onMouseMove}>
            <rect x={xScale.range[0]} y={yScale.range[1]} width={xScale.range[1]-xScale.range[0]} height={yScale.range[0]-yScale.range[1]} opacity={0} fill="rgba(255,255,255,0)"/>
            {this.areas}
            {this.borders}
            {hoverIndex !== undefined && <g className="hoverIndicator">
                {data.map(series => {
                    return <circle key={series.key} cx={xScale.place(series.values[hoverIndex].x)} cy={yScale.place(series.values[hoverIndex].y)} r={2} fill={series.color}/>
                })}
                <line x1={xScale.place(data[0].values[hoverIndex].x)} y1={yScale.range[0]} x2={xScale.place(data[0].values[hoverIndex].x)} y2={yScale.range[1]} stroke="rgba(180,180,180,.4)"/>
            </g>}
        </g>
    }
}

@observer
export class StackedArea extends React.Component<{ bounds: Bounds, chart: ChartConfig }> {
    base: React.RefObject<SVGGElement> = React.createRef()

    static contextType = ChartViewContext
    context!: ChartViewContextType

    @computed get chart(): ChartConfig { return this.props.chart }
    @computed get bounds(): Bounds { return this.props.bounds }
    @computed get transform() { return this.props.chart.stackedArea }

    @computed get midpoints(): number[] {
        let prevY = 0
        return this.transform.stackedData.map(series => {
            const lastValue = last(series.values)
            if (lastValue) {
                const middleY = prevY + (lastValue.y - prevY)/2
                prevY = lastValue.y
                return middleY
            } else {
                return 0
            }
        })
    }

    @computed get legendItems() {
        const {transform, midpoints} = this
        const items = transform.stackedData.map((d, i) => ({
            color: d.color,
            key: d.key,
            label: this.chart.data.formatKey(d.key),
            yValue: midpoints[i]
        })).reverse()
        return items
    }

    @computed get legend(): HeightedLegend|undefined {
        if (this.chart.hideLegend)
            return undefined

        const that = this
        return new HeightedLegend({
            get maxWidth() { return 150 },
            get fontSize() { return that.chart.baseFontSize },
            get items() { return that.legendItems }
        })
    }

    @computed get axisBox(): AxisBox {
        const {bounds, transform, legend, chart} = this
        const {xAxis, yAxis} = transform
        return new AxisBox({bounds: bounds.padRight(legend ? legend.width : 20), fontSize: chart.baseFontSize, xAxis, yAxis})
    }

    @observable hoverIndex?: number
    @action.bound onHover(hoverIndex: number|undefined) {
        this.hoverIndex = hoverIndex
    }

    @action.bound onLegendClick(datakey: string) {
        if (this.chart.data.canAddData) {
            this.context.chartView.isSelectingData = true
        }
    }

    @computed get tooltip(): JSX.Element|undefined {
        if (this.hoverIndex === undefined) return undefined

        const {transform, hoverIndex, axisBox, chart} = this

        // Grab the first value to get the year from
        const refValue = transform.stackedData[0].values[hoverIndex]

        // If some data is missing, don't calculate a total
        const someMissing = transform.stackedData.some(g => !!g.values[hoverIndex].isFake)

        const legendBlockStyle = { width: '10px', height: '10px', display: 'inline-block', marginRight: '2px' }

        return <Tooltip x={axisBox.xScale.place(refValue.x)} y={axisBox.yScale.rangeMin + axisBox.yScale.rangeSize/2} style={{padding: "0.3em"}} offsetX={5}>
            <table style={{fontSize: "0.9em", lineHeight: "1.4em"}}>
                <tbody>
                    <tr>
                        <td><strong>{formatYear(refValue.x)}</strong></td>
                        <td></td>
                    </tr>
                    {reverse(clone(transform.stackedData)).map(series => {
                        const value = series.values[hoverIndex]
                        return <tr key={series.key}>
                            <td style={{paddingRight: "0.8em", fontSize: "0.9em"}}>
                                <div style={{...legendBlockStyle, backgroundColor: series.color}}/> {chart.data.formatKey(series.key)}
                            </td>
                            <td style={{textAlign: "right"}}>{value.isFake ? "No data" : transform.yAxis.tickFormat(value.origY as number, { noTrailingZeroes: false })}</td>
                        </tr>
                    })}
                    {/* Total */}
                    {!someMissing && <tr>
                        <td style={{fontSize: "0.9em"}}>
                            <div style={{...legendBlockStyle, backgroundColor: 'transparent'}}/> <strong>Total</strong>
                        </td>
                        <td style={{textAlign: "right"}}>
                            <span>
                                <strong>{transform.yAxis.tickFormat(transform.stackedData[transform.stackedData.length-1].values[hoverIndex].y, { noTrailingZeroes: false })}</strong>
                            </span>
                        </td>
                    </tr>}
                </tbody>
            </table>
        </Tooltip>
    }

    animSelection?: d3.Selection<d3.BaseType, unknown, SVGGElement | null, unknown>
    componentDidMount() {
        // Fancy intro animation

        const base = select(this.base.current)
        this.animSelection = select(this.base.current).selectAll("clipPath > rect")
            .attr("width", 0)

        this.animSelection.transition()
                .duration(800)
                .ease(easeLinear)
                .attr("width", this.bounds.width)
                .on("end", () => this.forceUpdate()) // Important in case bounds changes during transition
    }

    componentWillUnmount() {
        if (this.animSelection) this.animSelection.interrupt()
    }

    @computed get renderUid() {
        return guid()
    }

    render() {
        if (this.transform.failMessage)
            return <NoData bounds={this.props.bounds} message={this.transform.failMessage}/>

        const {chart, bounds, axisBox, legend, transform, renderUid} = this
        return <g ref={this.base} className="StackedArea">
            <defs>
                <clipPath id={`boundsClip-${renderUid}`}>
                    <rect x={axisBox.innerBounds.x} y={0} width={bounds.width} height={bounds.height*2}></rect>
                </clipPath>
            </defs>
            <StandardAxisBoxView axisBox={axisBox} chart={chart}/>
            <g clipPath={`url(#boundsClip-${renderUid})`}>
                {legend && <HeightedLegendView legend={legend} x={bounds.right-legend.width} yScale={axisBox.yScale} focusKeys={[]} onClick={this.onLegendClick} clickableMarks={this.chart.data.canAddData} />}
                <Areas axisBox={axisBox} data={transform.stackedData} onHover={this.onHover}/>
            </g>
            {this.tooltip}
        </g>
    }
}
