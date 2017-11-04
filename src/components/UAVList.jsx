/**
 * @file Component that displays the status of the known UAVs in a Flockwave
 * flock.
 */

import Immutable from 'immutable'

import { ListItem } from 'material-ui/List'
import IconButton from 'material-ui/IconButton'
import ImageAdjust from 'material-ui/svg-icons/image/adjust'

import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import u from 'updeep'

import { multiSelectableListOf } from './helpers/lists'
import UAVToolbar from './UAVToolbar'
import CountMonitor from './CountMonitor'

import { setSelectedFeatures } from '../actions/map'
import Flock from '../model/flock'
import { formatCoordinate } from '../utils/geography'

import { mapViewToLocationSignal } from '../signals'

/**
 * Formats the secondary text to be shown for a single UAV in the UAV list.
 *
 * @param {UAV} uav  the UAV to format
 * @return {string} the formatted secondary text of the UAV
 */
function formatSecondaryTextForUAV (uav) {
  return `at ${formatCoordinate([uav.lon, uav.lat])}, heading ${uav.heading.toFixed(1)}°`
}

const jumpToUAV = function () {
  const uav = this['data-uav']
  mapViewToLocationSignal.dispatch({
    center: {
      lon: uav.lon,
      lat: uav.lat
    }
  }, 500)
}

/**
 * Presentation component for the entire UAV list.
 */
const UAVListPresentation = multiSelectableListOf((uav, props, selected) => {
  const rightIconButton = (
    <IconButton data-uav={uav} onClick={jumpToUAV}
      tooltip={`Jump to ${uav.id}`} tooltipPosition={'bottom-left'}>
      <ImageAdjust />
    </IconButton>
  )

  return <ListItem key={uav.id}
    primaryText={uav.id}
    secondaryText={formatSecondaryTextForUAV(uav)}
    rightIconButton={rightIconButton}
    className={selected ? 'selected-list-item' : undefined}
    onClick={props.onItemSelected} />
}, {
  backgroundHint: 'No UAVs',
  dataProvider: 'uavs'
})
UAVListPresentation.displayName = 'UAVListPresentation'

/**
 * React component that shows the state of the known UAVs in a Flockwave
 * flock.
 */
class UAVList extends React.Component {
  constructor (props) {
    super(props)

    this._eventBindings = {}

    this._onUAVsUpdated = this._onUAVsUpdated.bind(this)

    this.state = {
      uavs: Immutable.List(),
      uavIdToIndex: Immutable.Map()
    }
  }

  componentWillReceiveProps (newProps) {
    this._onFlockMaybeChanged(this.props.flock, newProps.flock)
  }

  componentDidMount () {
    this._onFlockMaybeChanged(undefined, this.props.flock)
  }

  componentWillUnmount () {
    this._onFlockMaybeChanged(this.props.flock, undefined)
  }

  /**
   * Function that is called when we suspect that the flock associated to
   * the component may have changed.
   *
   * This function subscribes to the events from the new flock and
   * unsubscribes from the events of the old flock. It also performs a
   * strict equality check on the two flocks because they may be equal.
   *
   * @param {Flock} oldFlock  the old flock associated to the component
   * @param {Flock} newFlock  the new flock associated to the component
   */
  _onFlockMaybeChanged (oldFlock, newFlock) {
    if (oldFlock === newFlock) {
      return
    }

    if (oldFlock) {
      oldFlock.uavsUpdated.detach(this._eventBindings.uavsUpdated)
      delete this._eventBindings.uavsUpdated
    }

    if (newFlock) {
      this._eventBindings.uavsUpdated = newFlock.uavsUpdated.add(this._onUAVsUpdated)
    }
  }

  /**
   * Event handler that is called when the status of some of the UAVs has
   * changed in the flock and the list should be re-rendered.
   *
   * @listens Flock#uavsUpdated
   * @param {UAV[]} updatedUavs  the UAVs that should be refreshed
   */
  _onUAVsUpdated (updatedUavs) {
    let { uavs, uavIdToIndex } = this.state

    for (let uav of updatedUavs) {
      const index = uavIdToIndex.get(uav.id)
      const uavRepr = this._pickRelevantUAVProps(uav)

      if (index === undefined) {
        uavIdToIndex = uavIdToIndex.set(uav.id, uavs.size)
        uavs = uavs.push(uavRepr)
      } else {
        uavs = uavs.set(index, uavRepr)
      }
    }

    const newState = u({ uavs, uavIdToIndex }, this.state)
    this.setState(newState)
  }

  /**
   * Picks the properties from an UAV object that are relevant for the list
   * items in this list.
   *
   * @param {UAV} uav  the UAV to pick the properties from
   * @return {Object}  the object containing the picked props
   */
  _pickRelevantUAVProps (uav) {
    return {
      id: uav.id,
      lastUpdated: uav.lastUpdated,
      lat: uav.lat,
      lon: uav.lon,
      heading: uav.heading,
      error: uav.error
    }
  }

  render () {
    const { selectedUAVIds, onSelectionChanged } = this.props

    const uavs = this.state.uavs.sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    )

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <UAVToolbar selectedUAVIds={selectedUAVIds} uavs={uavs} />

        <div style={{ height: '100%', overflow: 'auto' }}>
          <UAVListPresentation uavs={uavs} value={selectedUAVIds || []}
            onChange={onSelectionChanged} />
        </div>

        <CountMonitor selectedUAVIds={selectedUAVIds} uavs={uavs} />
      </div>
    )
  }
}

UAVList.propTypes = {
  flock: PropTypes.instanceOf(Flock),
  selectedUAVIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSelectionChanged: PropTypes.func
}

UAVList.defaultProps = {
  selectedUAVIds: []
}

const SmartUAVList = connect(
  // mapStateToProps
  state => ({
    selectedUAVIds: state.map.selection
  }),
  // mapDispatchToProps
  dispatch => ({
    onSelectionChanged: (event, uavIds) => {
      dispatch(setSelectedFeatures(uavIds))
    }
  })
)(UAVList)

export default SmartUAVList
