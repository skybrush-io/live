/**
 * @file Component that displays the status of the known UAVs in a Flockwave
 * flock.
 */

import Immutable from 'immutable'
import { ListItem } from 'material-ui/List'
import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import u from 'updeep'

import { multiSelectableListOf } from './helpers/lists'
import UAVToolbar from './UAVToolbar'

import { setSelectedFeatures } from '../actions/map'
import Flock from '../model/flock'
import { formatCoordinate } from '../utils/geography'

/**
 * Formats the secondary text to be shown for a single UAV in the UAV list.
 *
 * @param {UAV} uav  the UAV to format
 * @return {string} the formatted secondary text of the UAV
 */
function formatSecondaryTextForUAV (uav) {
  return `at ${formatCoordinate([uav.lon, uav.lat])}, heading ${uav.heading.toFixed(1)}°`
}

/**
 * Presentation component for the entire UAV list.
 */
const UAVListPresentation = multiSelectableListOf((uav, props, selected) => {
  return <ListItem key={uav.id}
                   primaryText={uav.id}
                   secondaryText={formatSecondaryTextForUAV(uav)}
                   className={selected ? 'selected-list-item' : undefined}
                   onTouchTap={props.onItemSelected} />
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

    this.eventBindings_ = {}

    this.onUAVsUpdated_ = this.onUAVsUpdated_.bind(this)

    this.state = {
      uavs: Immutable.List(),
      uavIdToIndex: Immutable.Map()
    }
  }

  componentWillReceiveProps (newProps) {
    this.onFlockMaybeChanged_(this.props.flock, newProps.flock)
  }

  componentDidMount () {
    this.onFlockMaybeChanged_(undefined, this.props.flock)
  }

  componentWillUnmount () {
    this.onFlockMaybeChanged_(this.props.flock, undefined)
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
  onFlockMaybeChanged_ (oldFlock, newFlock) {
    if (oldFlock === newFlock) {
      return
    }

    if (oldFlock) {
      oldFlock.uavsUpdated.detach(this.eventBindings_.uavsUpdated)
      delete this.eventBindings_.uavsUpdated
    }

    if (newFlock) {
      this.eventBindings_.uavsUpdated = newFlock.uavsUpdated.add(this.onUAVsUpdated_)
    }
  }

  /**
   * Event handler that is called when the status of some of the UAVs has
   * changed in the flock and the list should be re-rendered.
   *
   * @listens Flock#uavsUpdated
   * @param {UAV[]} updatedUavs  the UAVs that should be refreshed
   */
  onUAVsUpdated_ (updatedUavs) {
    let { uavs, uavIdToIndex } = this.state

    for (let uav of updatedUavs) {
      const index = uavIdToIndex.get(uav.id)
      const uavRepr = this.pickRelevantUAVProps_(uav)

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
  pickRelevantUAVProps_ (uav) {
    return {
      id: uav.id,
      lat: uav.lat,
      lon: uav.lon,
      heading: uav.heading
    }
  }

  render () {
    const { selectedUAVIds, onSelectionChanged } = this.props
    const { uavs } = this.state
    return (
      <div style={{ height: '100%' }}>
        <UAVToolbar />
        <UAVListPresentation uavs={uavs} value={selectedUAVIds || []}
                             onChange={onSelectionChanged} />
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
