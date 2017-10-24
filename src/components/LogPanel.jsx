/**
 * @file Component for displaying logged messages.
 */

import _ from 'lodash'

import ActionReceipt from 'material-ui/svg-icons/action/receipt'
import ActionInfo from 'material-ui/svg-icons/action/info'
import AlertWarning from 'material-ui/svg-icons/alert/warning'
import ContentReport from 'material-ui/svg-icons/content/report'

import React from 'react'
import { connect } from 'react-redux'

import { deleteLogItem, clearLogItems } from '../actions/log'

import FilterableSortableTable, {FilterTypes} from './FilterableSortableTable'

const logLevelIcons = {
  0: { Icon: ActionInfo, color: '#528FF3' }, // Info
  1: { Icon: AlertWarning, color: '#F4BD01' }, // Warning
  2: { Icon: ContentReport, color: '#EA3B42' } // Error
}

class LogPresentation extends React.Component {
  render () {
    const tableColumns = [
      {
        name: 'Level',
        displayName: <ActionReceipt />,
        width: 100,
        dataExtractor: row => row.level,
        displayRenderer: data => {
          const { Icon, color } = logLevelIcons[data]
          return <Icon color={color} />
        },
        filterType: FilterTypes.list,
        filterList: Object.keys(logLevelIcons).map((k, i) => {
          const levelIcon = logLevelIcons[i]
          return { value: i, display: <levelIcon.Icon color={levelIcon.color} /> }
        }),
        sorter: (a, b) => a.level - b.level
      },
      {
        name: 'Timestamp',
        width: 150,
        dataExtractor: row => row.timestamp,
        displayRenderer: data => {
          const currentDate = new Date(data)
          return _.padStart(currentDate.getHours(), 2, '0') + ':' +
          _.padStart(currentDate.getMinutes(), 2, '0') + ':' +
          _.padStart(currentDate.getSeconds(), 2, '0')
        },
        filterType: FilterTypes.range,
        sorter: (a, b) => a.timestamp - b.timestamp
      },
      {
        name: 'Content',
        width: 600,
        dataExtractor: row => row.content,
        filterType: FilterTypes.text
      }
    ]

    return (
      <FilterableSortableTable
        dataSource={this.props.logItems}
        availableColumns={tableColumns}
        defaultSortBy={1}
        defaultReverse
      />
    )
  }
}

const Log = connect(
  // mapStateToProps
  state => ({
    logItems: state.log.items
  }),
  // mapDispatchToProps
  dispatch => ({
    onDeleteLogItem (id) {
      dispatch(deleteLogItem(id))
    },
    onClearLogItems () {
      dispatch(clearLogItems())
    }
  })
)(LogPresentation)

export default Log
