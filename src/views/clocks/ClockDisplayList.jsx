/**
 * @file Component that displays the status of a Flockwave clock.
 */

import { red, green } from 'material-ui/colors'
import PlayArrow from 'material-ui-icons/PlayArrow'
import Stop from 'material-ui-icons/Stop'
import Avatar from 'material-ui/Avatar'
import { ListItem, ListItemText } from 'material-ui/List'

import isFunction from 'lodash/isFunction'
import moment from 'moment'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import { listOf } from '../../components/helpers/lists'

/**
 * Avatars for stopped and running clocks.
 */
const avatars = [
  <Avatar key='stop' style={{ backgroundColor: red['A700'] }}>
    <Stop />
  </Avatar>,
  <Avatar key='play' style={{ backgroundColor: green[500] }}>
    <PlayArrow />
  </Avatar>
]

/**
 * Remapping of commonly used clock IDs in a Flockwave server to something
 * more human-readable.
 */
const clockIdRemapping = {
  'system': 'Server clock',
  '__local__': 'Client clock',
  'mtc': 'MIDI timecode'
}

/**
 * Presentation component for showing the state of a single Flockwave clock.
 */
class ClockDisplayListEntry extends React.Component {
  constructor () {
    super()
    this.timeoutId = undefined
    this.isStillMounted = false

    this.clearTimeoutIfNeeded = this.clearTimeoutIfNeeded.bind(this)
    this.formatTicks = this.formatTicks.bind(this)
    this.tick = this.tick.bind(this)
  }

  clearTimeoutIfNeeded () {
    if (this.timeoutId !== undefined) {
      clearTimeout(this.timeoutId)
      this.timeoutId = undefined
    }
  }

  componentDidMount () {
    this.isStillMounted = true
    if (this.props.running) {
      // Make sure that the timer is ticking
      this.tick(/* forceRefresh = */ false)
    }
  }

  componentDidUpdate (newProps) {
    if (newProps.id !== this.props.id ||
        newProps.epoch !== this.props.epoch ||
        newProps.format !== this.props.format ||
        newProps.referenceTime !== this.props.referenceTime ||
        newProps.running !== this.props.running ||
        newProps.ticks !== this.props.ticks ||
        newProps.ticksPerSecond !== this.props.ticksPerSecond ||
        newProps.updateFrequency !== this.props.updateFrequency) {
      this.clearTimeoutIfNeeded()
      this.tick()
    }
  }

  componentWillUnmount () {
    this.isStillMounted = false
    this.clearTimeoutIfNeeded()
  }

  formatClockId (id) {
    return clockIdRemapping[id] || `Clock '${id}'`
  }

  formatTicks (ticks) {
    const { epoch, format, ticksPerSecond } = this.props
    if (epoch === undefined) {
      if (ticksPerSecond <= 1) {
        // No epoch, so we just simply show a HH:MM:SS timestamp
        return moment.utc(0)
          .add(Math.floor(ticks / ticksPerSecond), 'second')
          .format('HH:mm:ss')
      } else {
        // No epoch, so we just simply show a HH:MM:SS:FF SMPTE-style
        // timestamp. We (ab)use the millisecond part of the timestamp
        // to represent the number of frames
        return moment.utc(0)
          .add(Math.floor(ticks / ticksPerSecond), 'second')
          .add(ticks % ticksPerSecond * 10, 'millisecond')
          .format('HH:mm:ss:SS')
      }
    } else {
      // We have an epoch, so create a date and use the formatter
      const date = moment.unix(epoch + ticks / ticksPerSecond)
      return isFunction(format) ? format(date) : date.format(format)
    }
  }

  render () {
    const { id, running } = this.props
    const { referenceTime, ticks, ticksPerSecond } = this.props
    const avatar = avatars[running ? 1 : 0]
    const formattedId = this.formatClockId(id)
    const elapsed = running ? (moment().valueOf() / 1000 - referenceTime) : 0
    const extrapolatedTicks = ticks + elapsed * ticksPerSecond
    const formattedTime = this.formatTicks(extrapolatedTicks)
    return (
      <ListItem>
        {avatar}
        <ListItemText primary={formattedTime} secondary={formattedId} />
      </ListItem>
    )
  }

  tick (forceRefresh = true) {
    const { running, updateFrequency } = this.props

    if (!this.isStillMounted || !running || updateFrequency <= 0) {
      this.clearTimeoutIfNeeded()
      return
    }

    this.timeoutId = setTimeout(this.tick, updateFrequency)

    if (forceRefresh) {
      this.forceUpdate()
    }
  }
}

ClockDisplayListEntry.propTypes = {
  /** The epoch time of the clock, i.e. the number of seconds since the
   * UNIX epoch when the tick count of the clock was zero. If this is
   * given, the clock display will show a regular date. If this is not
   * specified, the clock display will show the date in
   * hours:minutes:seconds:ticks format.
   */
  epoch: PropTypes.number,
  /** The format to use for displaying the clock value */
  format: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
  /** The identifier of the clock */
  id: PropTypes.string.isRequired,
  /**
   * The reference time in the local clock that corresponds to the tick
   * value stored in the 'ticks' property, expressed in the number of
   * seconds elapsed since the Unix epoch.
   */
  referenceTime: PropTypes.number.isRequired,
  /**
   * The current number of clock ticks that should be shown.
   */
  ticks: PropTypes.number.isRequired,
  /**
   * The number of clock ticks per second.
   */
  ticksPerSecond: PropTypes.number.isRequired,
  /** Whether the clock is running according to the Flockwave server */
  running: PropTypes.bool.isRequired,
  /**
   * The update frequency of the clock display when it is running, expressed
   * in milliseconds. The clock display will be refreshed once in every
   * X milliseconds.
   */
  updateFrequency: PropTypes.number.isRequired
}

ClockDisplayListEntry.defaultProps = {
  format: 'YYYY-MM-DD HH:mm:ss Z',
  id: 'system',
  referenceTime: 0,
  running: false,
  ticks: 0,
  ticksPerSecond: 1,
  updateFrequency: 1000
}

/**
 * Presentation component for showing the state of a set of Flockwave
 * clocks.
 *
 * @return  {Object}  the rendered clock display list component
 */
const ClockDisplayListPresentation = listOf(ClockDisplayListEntry, {
  dataProvider: 'clocks',
  backgroundHint: 'No clocks'
})
ClockDisplayListPresentation.displayName = 'ClockDisplayListPresentation'

/**
 * Smart component for showing the state of the known Flockwave clocks from
 * the Redux store.
 */
const ClockDisplayList = connect(
  // mapStateToProps
  state => ({
    clocks: state.clocks.order.map(
      entryName => {
        const result = { ...state.clocks.items[entryName] }
        if (result.ticksPerSecond > 1) {
          result.updateFrequency = Math.max(1000 / result.ticksPerSecond, 100)
        } else {
          result.updateFrequency = 1000
        }
        return result
      }
    ),
    dense: true
  }),
  // mapDispatchToProps
  undefined
)(ClockDisplayListPresentation)

export default ClockDisplayList
