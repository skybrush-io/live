/**
 * @file Component for displaying logged messages.
 */

import _ from 'lodash'

import ActionReceipt from 'material-ui/svg-icons/action/receipt'
import ActionInfo from 'material-ui/svg-icons/action/info'
import AlertWarning from 'material-ui/svg-icons/alert/warning'
import ContentReport from 'material-ui/svg-icons/content/report'

import React, { PropTypes } from 'react'
import { connect } from 'react-redux'

import { deleteLogItem, clearLogItems } from '../actions/log'

import FlexibleSortableTable from './FilterableSortableTable'

const logLevelIcons = {
  0: { Icon: ActionInfo, color: '#528FF3' }, // Info
  1: { Icon: AlertWarning, color: '#F4BD01' }, // Warning
  2: { Icon: ContentReport, color: '#EA3B42' } // Error
}

class LogPresentation extends React.Component {
  render () {
    const tableColumns = [
      {
        name: <ActionReceipt style={{ marginTop: '-2px' }} />,
        width: 35,
        dataExtractor: row => {
          const { Icon, color } = logLevelIcons[row.level]
          return <Icon color={color} style={{ marginTop: '-2px' }} />
        }
      },
      {
        name: 'Timestamp',
        width: 100,
        dataExtractor: row =>
          _.padStart(row.timestamp.getHours(), 2, '0') + ':' +
          _.padStart(row.timestamp.getMinutes(), 2, '0')
      },
      {
        name: 'Content',
        width: 500,
        dataExtractor: row => row.content
      }
    ]

    return (
      <FlexibleSortableTable
        dataSource={this.props.logItems}
        defaultColumns={tableColumns}
      />
    )
  }
}

const Log = connect(
  // mapStateToProps
  state => ({
    logItems: state.log
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
