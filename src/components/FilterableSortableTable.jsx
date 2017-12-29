/**
 * @file Component for displaying tabular data
 * in a filterable and sortable manner.
 */

import PropTypes from 'prop-types'
import React from 'react'

import ActionSettingsBackupRestore from 'material-ui-icons/SettingsBackupRestore'
import EditorHighlight from 'material-ui-icons/Highlight'
import ContentSort from 'material-ui-icons/Sort'

import Button from 'material-ui/Button'
import Checkbox from 'material-ui/Checkbox'
import Popover from 'material-ui/Popover'
import TextField from 'material-ui/TextField'

require('../../assets/css/FilterableSortableTable.less')

export const FilterTypes = {
  list: Symbol('list'),
  range: Symbol('range'),
  text: Symbol('text')
}

const filterPropertiesInitializers = {
  [FilterTypes.list]: (col) => ({
    list: col.filterList.map(x => ({ visible: true, item: x })),
    map: new Map(col.filterList.map(x => [x.value, true]))
  }),
  [FilterTypes.range]: (col) => ({}),
  [FilterTypes.text]: (col) => ({ text: '' })
}

const filterTesters = {
  [FilterTypes.list]: (filterProperties, data) => filterProperties.map.get(data),
  [FilterTypes.range]: (filterProperties, data) => true,
  [FilterTypes.text]: (filterProperties, data) => data.match(filterProperties.text)
}

class FilterableSortableTable extends React.Component {
  constructor (props) {
    super(props)

    const {
      defaultColumns = [...Array(props.availableColumns.length)].map((x, i) => i)
    } = props

    const initializedAvailableColumns = props.availableColumns.map(col => (
      Object.assign({
        displayName: col.name,
        displayRenderer: x => x,
        filterProperties: filterPropertiesInitializers[col.filterType](col),
        sorter: (a, b) => (
          (col.dataExtractor(a) > col.dataExtractor(b)) -
          (col.dataExtractor(a) < col.dataExtractor(b))
        ) // Default sorting with JavaScript comparison operator
      }, col)
    ))

    this.state = {
      availableColumns: initializedAvailableColumns,
      currentColumns: defaultColumns,
      sortBy: props.defaultSortBy,
      reverse: props.defaultReverse,
      filterPopoverTargetColumnId: undefined,
      filterPopoverTargetElement: undefined
    }

    this._makeFilterClickHandler = this._makeFilterClickHandler.bind(this)
    this._closeFilterPopover = this._closeFilterPopover.bind(this)
    this._makeFilterPopoverContent = this._makeFilterPopoverContent.bind(this)
    this._makeSortClickHandler = this._makeSortClickHandler.bind(this)
    this._makeColumnControls = this._makeColumnControls.bind(this)
    this._makeSeparatorHandler = this._makeSeparatorHandler.bind(this)
    this._makeSeparator = this._makeSeparator.bind(this)
  }

  get _columns () {
    return this.state.currentColumns.map(i => this.state.availableColumns[i])
  }

  /**
   * Retrieves those rows that match the currently active filtering conditions
   * and orders them by the actual sorting column.
   */
  get _data () {
    const filteringColumns = this._columns.filter(col => 'filterType' in col)

    const filteredData = this.props.dataSource.filter(row =>
      filteringColumns.map(col => filterTesters[col.filterType](
        col.filterProperties,
        col.dataExtractor(row)
      )).every(x => x)
    )

    const sortedData = [...filteredData].sort(
      this.state.availableColumns[this.state.sortBy].sorter
    )

    return this.state.reverse ? sortedData.reverse() : sortedData
  }

  _makeFilterClickHandler (i) {
    return (e) => {
      this.setState({
        filterPopoverTargetColumnId: i,
        filterPopoverTargetElement: e.currentTarget
      })
    }
  }

  _closeFilterPopover () {
    this.setState({
      filterPopoverTargetColumnId: undefined,
      filterPopoverTargetElement: undefined
    })
  }

  /**
   * Generates the settings for the filter type of the column specified by
   * the id given in the parameter.
   *
   * @param {number} targetColumnId Identifier of the column being filtered.
   */
  _makeFilterPopoverContent (targetColumnId) {
    const targetColumn = this._columns[targetColumnId]

    return ({
      [FilterTypes.list]: (filterProperties) => (
        <div>
          {filterProperties.list.map(item =>
            <Checkbox key={`${item.item.value}_checkbox`}
              label={item.item.display}
              checked={item.visible}
              onCheck={() => {
                item.visible = !item.visible
                filterProperties.map.set(item.item.value, item.visible)

                this.forceUpdate()
              }}
            />
          )}
        </div>
      ),
      [FilterTypes.range]: (filterProperties) => (
        <div>
          Range
        </div>
      ),
      [FilterTypes.text]: (filterProperties) => (
        <div>
          <TextField id='filter-text' value={filterProperties.text}
            onChange={e => {
              filterProperties.text = e.target.value

              this.forceUpdate()
            }} />
        </div>
      )
    })[targetColumn.filterType](targetColumn.filterProperties, targetColumnId)
  }

  _makeSortClickHandler (i) {
    return () => {
      if (this.state.sortBy === i) {
        this.setState({ reverse: !this.state.reverse })
      } else {
        this.setState({ sortBy: i })
      }
    }
  }

  /**
   * Function that constructs extra controls to be put into the header
   * of the given column.
   *
   * @param {Object} col The desctiptor object of the current column.
   * @param {number} i The position of the column in the visible column list.
   */
  _makeColumnControls (col, i) {
    const sortStyle = Object.assign({},
      this.state.sortBy === i ? { fill: 'rgb(0, 188, 212)' } : {},
      this.state.reverse ? {} : { transform: 'scaleY(-1)' }
    )

    const filterButton = ('filterType' in col) ? (
      <EditorHighlight onClick={this._makeFilterClickHandler(i)} />
    ) : false

    const sortButton = ('sorter' in col) ? (
      <ContentSort onClick={this._makeSortClickHandler(i)} style={sortStyle} />
    ) : false

    return (
      <div className='fst-column-controls'>
        {filterButton}
        {sortButton}
      </div>
    )
  }

  /**
   * Generates a handler callback that fires when a column separator is clicked.
   * The handler registers an event listeners for dragging and removes it when
   * the user lets go of the mouse button.
   *
   * @param {Object} col The desctiptor object of the current column.
   */
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
      <div key={`${col.name}_separator`} className='fst-separator'
        onMouseDown={this._makeSeparatorHandler(col)}
      />
    )
  }

  render () {
    const headerRow = (
      <div className='fst-header-row'>
        {[].concat(...this._columns.map((col, i) => [
          <div key={`${col.name}_column`} className='fst-cell'
            style={{ width: `${col.width - 3}px` }}
          >
            {col.name}
            {this._makeColumnControls(col, i)}
          </div>,
          this._makeSeparator(col)
        ]))}
      </div>
    )

    const filterPopover = (
      <Popover
        open={this.state.filterPopoverTargetElement !== undefined}
        anchorEl={this.state.filterPopoverTargetElement}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        targetOrigin={{ horizontal: 'left', vertical: 'top' }}
        onClose={this._closeFilterPopover}
        style={{ padding: '5px', textAlign: 'center', overflow: 'visible' }}
      >
        {this.state.filterPopoverTargetColumnId !== undefined
          ? this._makeFilterPopoverContent(this.state.filterPopoverTargetColumnId)
          : false}

        <Button
          onClick={() => {
            const col = this._columns[this.state.filterPopoverTargetColumnId]
            col.filterProperties = filterPropertiesInitializers[col.filterType](col)

            this.forceUpdate()
          }}>
          Reset
          <ActionSettingsBackupRestore />
        </Button>
      </Popover>
    )

    const dataRows = this._data.map(row => (
      <div key={`${this.props.rowIdGenerator(row)}_row`} className='fst-row'>
        {this._columns.map(col =>
          <div key={`${this.props.rowIdGenerator(row)}_${col.name}_cell`}
            className='fst-cell' style={{ width: `${col.width}px` }}
          >
            {col.displayRenderer(col.dataExtractor(row))}
          </div>
        )}
      </div>
    ))

    const fullWidth = this._columns.reduce(
      (width, col) => width + col.width + 6, 1
    )

    return (
      <div className='fst-root'>
        <div className='fst-container' style={{ minWidth: `${fullWidth}px` }}>
          {headerRow}
          {filterPopover}
          <div className='fst-data-container'>
            {dataRows}
          </div>
        </div>
      </div>
    )
  }
}

FilterableSortableTable.propTypes = {
  dataSource: PropTypes.array.isRequired,
  rowIdGenerator: PropTypes.func.isRequired,
  availableColumns: PropTypes.array.isRequired,
  defaultColumns: PropTypes.array,
  defaultSortBy: PropTypes.number,
  defaultReverse: PropTypes.bool
}

FilterableSortableTable.defaultProps = {
  rowIdGenerator: row => {
    if (!('id' in row)) {
      throw new Error(
        'FilterableSortableTable: Please include a field named "id"' +
        'in the row objects or provide your own rowIdGenerator implementation!'
      )
    }
    return row.id
  },
  defaultSortBy: 0,
  defaultReverse: false
}

export default FilterableSortableTable
