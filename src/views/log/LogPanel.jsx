/**
 * @file Component for displaying logged messages.
 */

import { padStart, property } from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import ActionReceipt from 'material-ui-icons/Receipt'
import ActionInfo from 'material-ui-icons/Info'
import AlertWarning from 'material-ui-icons/Warning'
import ContentReport from 'material-ui-icons/Report'

import { deleteLogItem, clearLogItems, updateLogPanelVisibility } from '../../actions/log'
import FilterableSortableTable, { FilterTypes } from '../../components/FilterableSortableTable'
import { colorForLogLevel, LogLevel } from '../../utils/logging'

function iconForLogLevel (level) {
  const style = {
    color: colorForLogLevel(level)
  }
  if (level <= LogLevel.INFO) {
    return <ActionInfo style={style} />
  } else if (level <= LogLevel.WARNING) {
    return <AlertWarning style={style} />
  } else {
    return <ContentReport style={style} />
  }
}

class LogPresentation extends React.Component {
  componentWillMount () {
    if (this.props.onMounting) {
      this.props.onMounting()
    }
  }

  componentWillUnmount () {
    if (this.props.onUnmounting) {
      this.props.onUnmounting()
    }
  }

  render () {
    const tableColumns = [
      {
        name: 'Level',
        displayName: <ActionReceipt />,
        width: 100,
        dataExtractor: property('level'),
        displayRenderer: iconForLogLevel,
        filterType: FilterTypes.list,
        filterList: Object.keys(LogLevel).map(level => ({
          value: LogLevel[level],
          display: iconForLogLevel(LogLevel[level])
        })),
        sorter: (a, b) => a.level - b.level
      },
      {
        name: 'Timestamp',
        width: 150,
        dataExtractor: property('timestamp'),
        displayRenderer: data => {
          const currentDate = new Date(data)
          return padStart(currentDate.getHours(), 2, '0') + ':' +
          padStart(currentDate.getMinutes(), 2, '0') + ':' +
          padStart(currentDate.getSeconds(), 2, '0')
        },
        filterType: FilterTypes.range,
        sorter: (a, b) => a.timestamp - b.timestamp
      },
      {
        name: 'Message',
        width: 600,
        dataExtractor: property('message'),
        filterType: FilterTypes.text
      }
    ]

    return (
      <FilterableSortableTable
        dataSource={this.props.items}
        availableColumns={tableColumns}
        defaultSortBy={1}
        defaultReverse
      />
    )
  }
}

LogPresentation.propTypes = {
  items: PropTypes.array,

  onMounting: PropTypes.func,
  onUnmounting: PropTypes.func
}

const Log = connect(
  // mapStateToProps
  state => ({
    items: state.log.items
  }),
  // mapDispatchToProps
  dispatch => ({
    onDeleteLogItem (id) {
      dispatch(deleteLogItem(id))
    },
    onClearLogItems () {
      dispatch(clearLogItems())
    },
    onMounting () {
      dispatch(updateLogPanelVisibility(true))
    },
    onUnmounting () {
      dispatch(updateLogPanelVisibility(false))
    }
  })
)(LogPresentation)

export default Log
