/**
 * @file Component for displaying tabular data
 * in a filterable and sortable manner.
 */

import IconButton from 'material-ui/IconButton'

import ActionSettings from 'material-ui/svg-icons/action/settings'

import React, { PropTypes } from 'react'

require('../../assets/css/FilterableSortableTable.less')

class FlexibleSortableTable extends React.Component {
  constructor (props) {
    super(props)

    const {
      dataSource,
      defaultColumns,
      avaiableColumns = defaultColumns
    } = props

    this._dataSource = dataSource
    this._avaiableColumns = avaiableColumns
    this._currentColumns = defaultColumns

    this._makeSeparatorHandler = this._makeSeparatorHandler.bind(this)
  }

  _makeSeparatorHandler (col) {
    return (e) => {
      const startX = e.clientX
      const startWidth = col.width

      const mouseMoveHandler = (e) => {
        col.width = startWidth + e.clientX - startX
        this.forceUpdate()
      }

      const mouseUpHandler = () => {
        window.removeEventListener('mousemove', mouseMoveHandler, false)
        window.removeEventListener('mouseup', mouseUpHandler, false)
      }

      window.addEventListener('mousemove', mouseMoveHandler, false)
      window.addEventListener('mouseup', mouseUpHandler, false)
    }
  }

  render () {
    const makeSeparator = col => (
      <div className={'fst-separator'}
        onMouseDown={this._makeSeparatorHandler(col)}
      />
    )

    const headerRow = (
      <div className={'fst-header-row'}>
        {[].concat(...this._currentColumns.map(col => [
          <div className={'fst-cell'} style={{ width: `${col.width - 3}px` }}>
            {col.name}
          </div>,
          makeSeparator(col)
        ]))}
      </div>
    )

    const dataRows = this._dataSource.map(row => (
      <div className={'fst-row'}>
        {this._currentColumns.map(col =>
          <div className={'fst-cell'} style={{ width: `${col.width}px` }}>
            {col.dataExtractor(row)}
          </div>
        )}
      </div>
    ))

    return (
      <div className={'fst-root'}>
        {headerRow}
        <div className={'fst-data-container'}>
          {dataRows}
        </div>
      </div>
    )
  }
}

export default FlexibleSortableTable
