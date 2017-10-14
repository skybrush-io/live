/**
 * @file Component for displaying tabular data
 * in a filterable and sortable manner.
 */

import React, { PropTypes } from 'react'

import EditorHighlight from 'material-ui/svg-icons/editor/highlight'
import ContentSort from 'material-ui/svg-icons/content/sort'

import Checkbox from 'material-ui/Checkbox'
import Popover from 'material-ui/Popover'

require('../../assets/css/FilterableSortableTable.less')

export const FilterTypes = {
  list: Symbol('list'),
  range: Symbol('range'),
  text: Symbol('text')
}

class FlexibleSortableTable extends React.Component {
  constructor (props) {
    super(props)

    this.filterPropertiesInitializers = {
      [FilterTypes.list]: (col) => ({
        list: col.filterList.map(x => ({ visible: true, item: x })),
        map: new Map(col.filterList.map(x => [x.value, true]))
      }),
      [FilterTypes.range]: (col) => ({}),
      [FilterTypes.text]: (col) => ({})
    }

    this.filterTesters = {
      [FilterTypes.list]: (filterProperties, data) => filterProperties.map.get(data),
      [FilterTypes.range]: (filterProperties, data) => true,
      [FilterTypes.text]: (filterProperties, data) => true
    }

    this.filterPopoverRenderers = {
      [FilterTypes.list]: (filterProperties) => (
        <div>
          {filterProperties.list.map(item =>
            <Checkbox
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
          Text
        </div>
      )
    }

    const {
      defaultColumns = [...Array(props.availableColumns.length)].map((x, i) => i)
    } = props

    const initializedAvailableColumns = props.availableColumns.map(col => (
      Object.assign({
        displayName: col.name,
        displayRenderer: x => x,
        filterProperties: this.filterPropertiesInitializers[col.filterType](col),
        sorter: (a, b) => (
          (col.dataExtractor(a) > col.dataExtractor(b)) -
          (col.dataExtractor(a) < col.dataExtractor(b))
        ) // Default sorting with JavaScript comparison operator
      }, col)
    ))

    this.state = {
      dataSource: props.dataSource,
      availableColumns: initializedAvailableColumns,
      currentColumns: defaultColumns,
      sortBy: props.defaultSortBy,
      reverse: props.defaultReverse,
      filterPopoverTargetColumnId: undefined,
      filterPopoverTargetElement: undefined
    }

    this._makeFilterClickHandler = this._makeFilterClickHandler.bind(this)
    this._closeFilterPopover = this._closeFilterPopover.bind(this)
    this._makeSortClickHandler = this._makeSortClickHandler.bind(this)
    this._makeColumnControls = this._makeColumnControls.bind(this)
    this._makeSeparatorHandler = this._makeSeparatorHandler.bind(this)
    this._makeSeparator = this._makeSeparator.bind(this)
  }

  get _columns () {
    return this.state.currentColumns.map(i => this.state.availableColumns[i])
  }

  get _data () {
    const filteringColumns = this._columns.filter(col => 'filterType' in col)

    const filteredData = this.state.dataSource.filter(row =>
      filteringColumns.map(col => this.filterTesters[col.filterType](
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

  _makeSortClickHandler (i) {
    return () => {
      if (this.state.sortBy === i) {
        this.setState({ reverse: !this.state.reverse })
      } else {
        this.setState({ sortBy: i })
      }
    }
  }

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
      <div className={'fst-column-controls'}>
        {filterButton}
        {sortButton}
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

    const filterPopover = (
      <Popover
        open={this.state.filterPopoverTargetElement !== undefined}
        anchorEl={this.state.filterPopoverTargetElement}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        targetOrigin={{ horizontal: 'left', vertical: 'top' }}
        onRequestClose={this._closeFilterPopover}
      >
        {this.state.filterPopoverTargetColumnId !== undefined
        ? this.filterPopoverRenderers[
          this._columns[this.state.filterPopoverTargetColumnId].filterType
        ](this._columns[this.state.filterPopoverTargetColumnId].filterProperties)
        : false}
      </Popover>
    )

    const dataRows = this._data.map(row => (
      <div className={'fst-row'}>
        {this._columns.map(col =>
          <div className={'fst-cell'} style={{ width: `${col.width}px` }}>
            {col.displayRenderer(col.dataExtractor(row))}
          </div>
        )}
      </div>
    ))

    return (
      <div className={'fst-root'}>
        {headerRow}
        {filterPopover}
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
  defaultSortBy: PropTypes.number,
  defaultReverse: PropTypes.bool
}

FlexibleSortableTable.defaultProps = {
  defaultSortBy: 0,
  defaultReverse: false
}

export default FlexibleSortableTable
