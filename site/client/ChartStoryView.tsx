import * as React from 'react'
import { observable, computed, action } from 'mobx'
import { observer } from 'mobx-react'

import { Bounds } from 'charts/Bounds'
import { ChartView } from 'charts/ChartView'
import { ChartConfig } from 'charts/ChartConfig'

// Wrapper for ChartView that uses css on figure element to determine the bounds
@observer
export class ChartStoryView extends React.Component {
    base: React.RefObject<HTMLDivElement> = React.createRef()
    @observable.ref bounds?: Bounds

    @action.bound calcBounds() {
        if (this.base.current) {
            this.bounds = Bounds.fromRect(
                this.base.current!.getBoundingClientRect()
            )
        }
    }

    componentDidMount() {
        this.chart = new ChartConfig(this.props.config, {})
        this.chart.receiveData(this.props.data as any)
        window.addEventListener('resize', this.calcBounds)
        this.calcBounds()
    }

    componentWillUnmount() {
        window.removeEventListener('resize', this.calcBounds)
    }

    render() {
        return (
            <figure data-grapher-src ref={this.base} className="h-96">
                {this.bounds && this.chart && (
                    <ChartView chart={this.chart} bounds={this.bounds} />
                )}
            </figure>
        )
    }
}
