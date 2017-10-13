/**
 * @file Component for displaying tabular data
 * in a filterable and sortable manner.
 */

import IconButton from 'material-ui/IconButton'

import ContentSort from 'material-ui/svg-icons/content/sort'

import React, { PropTypes } from 'react'

require('../../assets/css/FilterableSortableTable.less')

class FlexibleSortableTable extends React.Component {
  constructor (props) {
    super(props)

    const {
      defaultColumns = [...Array(props.availableColumns.length)].map((x, i) => i)
    } = props

    this._dataSource = props.dataSource
    this._availableColumns = props.availableColumns
    this._currentColumns = defaultColumns
    this._sort = props.defaultSort
    this._reverse = props.defaultReverse

    this._makeColumnControls = this._makeColumnControls.bind(this)
    this._makeSeparatorHandler = this._makeSeparatorHandler.bind(this)
    this._makeSeparator = this._makeSeparator.bind(this)
  }

  get _columns () {
    return this._currentColumns.map(i => this._availableColumns[i])
  }

  get _data () {
    const sortedData = [...this._dataSource].sort(
      this._availableColumns[this._sort].sorter
    )

    return this._reverse ? sortedData.reverse() : sortedData
  }

  _makeSortClickHandler (i) {
    return () => {
      if (this._sort === i) {
        this._reverse = !this._reverse
      } else {
        this._sort = i
      }

      this.forceUpdate()
    }
  }

  _makeColumnControls (col, i) {
    const sortStyle = Object.assign({},
      this._sort === i ? { fill: 'rgb(0, 188, 212)' } : {},
      this._reverse ? {} : { transform: 'scaleY(-1)' }
    )

    return (
      <div className={'fst-column-controls'}>
        <ContentSort onClick={this._makeSortClickHandler(i)} style={sortStyle} />
      </div>
    )
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

        document.body.style.cursor = 'auto'
      }

      window.addEventListener('mousemove', mouseMoveHandler, false)
      window.addEventListener('mouseup', mouseUpHandler, false)

      document.body.style.cursor = 'col-resize'
    }
  }

  _makeSeparator (col) {
    return (
      <div className={'fst-separator'}
        onMouseDown={this._makeSeparatorHandler(col)}
      />
    )
  }

  render () {
    const headerRow = (
      <div className={'fst-header-row'}>
        {[].concat(...this._columns.map((col, i) => [
          <div className={'fst-cell'} style={{ width: `${col.width - 3}px` }}>
            {col.name}
            {this._makeColumnControls(col, i)}
          </div>,
          this._makeSeparator(col)
        ]))}
      </div>
    )

    const dataRows = this._data.map(row => (
      <div className={'fst-row'}>
        {this._columns.map(col =>
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

FlexibleSortableTable.propTypes = {
  dataSource: PropTypes.array.isRequired,
  availableColumns: PropTypes.array.isRequired,
  defaultColumns: PropTypes.array,
  defaultSort: PropTypes.number,
  defaultReverse: PropTypes.bool
}

FlexibleSortableTable.defaultProps = {
  defaultSort: 0,
  defaultReverse: false
}

export default FlexibleSortableTable
