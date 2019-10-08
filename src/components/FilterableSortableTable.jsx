/**
 * @file Component for displaying tabular data
 * in a filterable and sortable manner.
 */

import PropTypes from 'prop-types';
import React from 'react';

import ActionSettingsBackupRestore from '@material-ui/icons/SettingsBackupRestore';
import EditorHighlight from '@material-ui/icons/Highlight';
import ContentSort from '@material-ui/icons/Sort';

import Button from '@material-ui/core/Button';

import Popover from '@material-ui/core/Popover';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import TextField from '@material-ui/core/TextField';

import { Range } from 'rc-slider';

import 'rc-slider/assets/index.css';
import '../../assets/css/FilterableSortableTable.less';

export const FilterTypes = {
  list: Symbol('list'),
  range: Symbol('range'),
  text: Symbol('text')
};

const filterPropertiesInitializers = {
  [FilterTypes.list]: col => ({
    list: col.filterList,
    map: new Map(col.filterList.map(x => [x.value, true]))
  }),
  [FilterTypes.range]: col => ({
    steps: 'filterProperties' in col ? col.filterProperties.steps : [],
    min: 0,
    max: 'filterProperties' in col ? col.filterProperties.steps.length - 1 : -1,
    sorter: col.sorter || ((a, b) => (a > b) - (a < b))
  }),
  [FilterTypes.text]: col => ({ text: '' })
};

const filterTesters = {
  [FilterTypes.list]: (filterProperties, data) =>
    filterProperties.map.get(data),
  [FilterTypes.range]: (filterProperties, data) => {
    const { steps, min, max, sorter } = filterProperties;

    return sorter(steps[min], data) <= 0 && sorter(data, steps[max]) <= 0;
  },
  [FilterTypes.text]: (filterProperties, data) =>
    data.match(filterProperties.text) ||
    data.toLowerCase().match(filterProperties.text.toLowerCase())
};

class FilterableSortableTable extends React.Component {
  constructor(props) {
    super(props);

    const {
      defaultColumns = [...new Array(props.availableColumns.length)].map(
        (x, i) => i
      )
    } = props;

    const initializedAvailableColumns = props.availableColumns.map(col =>
      Object.assign(
        {
          displayName: col.name,
          displayRenderer: x => x,
          filterProperties: filterPropertiesInitializers[col.filterType](col),
          // Default sorting with JavaScript comparison operator
          sorter: (a, b) => (a > b) - (a < b)
        },
        col
      )
    );

    this.state = {
      availableColumns: initializedAvailableColumns,
      currentColumns: defaultColumns,
      sortBy: props.defaultSortBy,
      reverse: props.defaultReverse,
      filterPopoverTargetColumnId: undefined,
      filterPopoverTargetElement: undefined
    };

    this._makeFilterClickHandler = this._makeFilterClickHandler.bind(this);
    this._closeFilterPopover = this._closeFilterPopover.bind(this);
    this._handleRangeChange = this._handleRangeChange.bind(this);
    this._makeListChangeHandler = this._makeListChangeHandler.bind(this);
    this._handleTextChange = this._handleTextChange.bind(this);
    this._makeFilterPopoverContent = this._makeFilterPopoverContent.bind(this);

    this._makeSortClickHandler = this._makeSortClickHandler.bind(this);
    this._makeColumnControls = this._makeColumnControls.bind(this);
    this._makeSeparatorHandler = this._makeSeparatorHandler.bind(this);
    this._makeSeparator = this._makeSeparator.bind(this);
    this._resetFilter = this._resetFilter.bind(this);
  }

  /**
   * React lifecycle event handler to update the steps of range type columns.
   *
   * @param {Object} oldProps The old props that the component used to have
   *        before the update
   */
  componentDidUpdate(oldProps) {
    if (oldProps.dataSource !== this.props.dataSource) {
      this.state.availableColumns
        .filter(col => col.filterType === FilterTypes.range)
        .forEach(col => {
          const sortedData = this.props.dataSource
            .map(row => col.dataExtractor(row))
            .sort(col.sorter);

          const wasMax =
            col.filterProperties.max === col.filterProperties.steps.length - 1;

          col.filterProperties.steps = sortedData.slice(1).reduce(
            (acc, curr) => {
              return col.sorter(acc[acc.length - 1], curr) === 0
                ? acc
                : [...acc, curr];
            },
            [sortedData[0]]
          );

          if (wasMax) {
            col.filterProperties.max = col.filterProperties.steps.length - 1;
          }
        });
    }
  }

  /**
   * Gets the list of currently visible columns.
   */
  get _columns() {
    return this.state.currentColumns.map(i => this.state.availableColumns[i]);
  }

  /**
   * Retrieves those rows that match the currently active filtering conditions
   * and orders them by the actual sorting column.
   */
  get _data() {
    const filteringColumns = this._columns.filter(col => 'filterType' in col);

    const filteredData = this.props.dataSource.filter(row =>
      filteringColumns
        .map(col =>
          filterTesters[col.filterType](
            col.filterProperties,
            col.dataExtractor(row)
          )
        )
        .every(x => x)
    );

    const sortedData = [...filteredData].sort((a, b) =>
      this.state.availableColumns[this.state.sortBy].sorter(
        this.state.availableColumns[this.state.sortBy].dataExtractor(a),
        this.state.availableColumns[this.state.sortBy].dataExtractor(b)
      )
    );

    return this.state.reverse ? sortedData.reverse() : sortedData;
  }

  _makeFilterClickHandler(i) {
    return e => {
      this.setState({
        filterPopoverTargetColumnId: i,
        filterPopoverTargetElement: e.currentTarget
      });
    };
  }

  _closeFilterPopover() {
    this.setState({
      filterPopoverTargetColumnId: undefined,
      filterPopoverTargetElement: undefined
    });
  }

  /**
   * Function to create handlers that update the filterProperties of list type
   * columns.
   *
   * @param {Object} item The list item to toggle visibility of.
   *
   * @return {function} The handler to be assigned to a given item's Checkbox
   *         chage event.
   */
  _makeListChangeHandler(item) {
    return e => {
      const { filterProperties } = this._columns[
        this.state.filterPopoverTargetColumnId
      ];

      filterProperties.map.set(
        item.value,
        !filterProperties.map.get(item.value)
      );

      this.forceUpdate();
    };
  }

  /**
   * Function to update the filterProperties of range type columns.
   *
   * @param {number[]} newLimits A numeric array containing the new lower and
   *        upper bounds from the Range component of the rc-slider package.
   */
  _handleRangeChange([newMin, newMax]) {
    this._columns[this.state.filterPopoverTargetColumnId].filterProperties = {
      ...this._columns[this.state.filterPopoverTargetColumnId].filterProperties,
      min: newMin,
      max: newMax
    };

    this.forceUpdate();
  }

  /**
   * Function to update the filterProperties of text type columns.
   *
   * @param {InputEvent} e The change event fired by the TextField component.
   */
  _handleTextChange(e) {
    this._columns[this.state.filterPopoverTargetColumnId].filterProperties = {
      ...this._columns[this.state.filterPopoverTargetColumnId].filterProperties,
      text: e.target.value
    };

    this.forceUpdate();
  }

  /**
   * Generates the settings popover's content for the filter type of the column
   * specified by the id given in the parameter.
   *
   * @param {number} targetColumnId Identifier of the column being filtered.
   *
   * @return {ReactElement} The contents of the filter popover.
   */
  _makeFilterPopoverContent(targetColumnId) {
    const targetColumn = this._columns[targetColumnId];

    const popoverContentStyle = { margin: '10px' };

    return {
      [FilterTypes.list]: filterProperties => (
        <div
          style={{
            ...popoverContentStyle,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {filterProperties.list.map(item => {
            return (
              <FormControlLabel
                key={`${item.value}_checkbox`}
                control={
                  <Checkbox
                    checked={filterProperties.map.get(item.value)}
                    onChange={this._makeListChangeHandler(item)}
                  />
                }
                label={item.display}
              />
            );
          })}
        </div>
      ),
      [FilterTypes.range]: filterProperties =>
        filterProperties.steps.length < 2 ? (
          <div style={popoverContentStyle}>
            Not enough data for range filter.
          </div>
        ) : (
          <div style={{ ...popoverContentStyle, width: '200px' }}>
            <Range
              min={0}
              max={filterProperties.steps.length - 1}
              value={[filterProperties.min, filterProperties.max]}
              onChange={this._handleRangeChange}
            />

            <div style={{ float: 'left' }}>
              {targetColumn.displayRenderer(
                filterProperties.steps[filterProperties.min]
              )}
            </div>
            <div style={{ float: 'right' }}>
              {targetColumn.displayRenderer(
                filterProperties.steps[filterProperties.max]
              )}
            </div>
          </div>
        ),
      [FilterTypes.text]: filterProperties => (
        <div style={popoverContentStyle}>
          <TextField
            id="filter-text"
            value={filterProperties.text}
            onChange={this._handleTextChange}
          />
        </div>
      )
    }[targetColumn.filterType](targetColumn.filterProperties, targetColumnId);
  }

  /**
   * Creates a handler function that sorts the rows according to  the column
   * specified by it's index. If the table is already being sorted by that
   * column then it reverses the order on subsequent clicks.
   *
   * @param {number} i The index of the column.
   *
   * @return {function} The handler function to be assigned to an event.
   */
  _makeSortClickHandler(i) {
    return () => {
      if (this.state.sortBy === i) {
        this.setState({ reverse: !this.state.reverse });
      } else {
        this.setState({ sortBy: i });
      }
    };
  }

  /**
   * Function that constructs extra controls to be put into the header
   * of the given column.
   *
   * @param {Object} col The desctiptor object of the current column.
   * @param {number} i The position of the column in the visible column list.
   *
   * @return {ReactElement} A div containing the filter and sort buttons.
   */
  _makeColumnControls(col, i) {
    const sortStyle = Object.assign(
      {},
      this.state.sortBy === i ? { fill: 'rgb(0, 188, 212)' } : {},
      this.state.reverse ? {} : { transform: 'scaleY(-1)' }
    );

    const filterButton =
      'filterType' in col ? (
        <EditorHighlight onClick={this._makeFilterClickHandler(i)} />
      ) : (
        false
      );

    const sortButton =
      'sorter' in col ? (
        <ContentSort
          style={sortStyle}
          onClick={this._makeSortClickHandler(i)}
        />
      ) : (
        false
      );

    return (
      <div className="fst-column-controls">
        {filterButton}
        {sortButton}
      </div>
    );
  }

  /**
   * Generates a handler callback that fires when a column separator is clicked.
   * The handler registers an event listeners for dragging and removes it when
   * the user lets go of the mouse button.
   *
   * @param {Object} col The desctiptor object of the current column.
   *
   * @return {function} A callback for handling the resizing of columns.
   */
  _makeSeparatorHandler(col) {
    return e => {
      const startX = e.clientX;
      const startWidth = col.width;

      const mouseMoveHandler = e => {
        col.width = startWidth + e.clientX - startX;
        this.forceUpdate();
      };

      const mouseUpHandler = () => {
        window.removeEventListener('mousemove', mouseMoveHandler, false);
        window.removeEventListener('mouseup', mouseUpHandler, false);

        document.body.style.cursor = 'auto';
      };

      window.addEventListener('mousemove', mouseMoveHandler, false);
      window.addEventListener('mouseup', mouseUpHandler, false);

      document.body.style.cursor = 'col-resize';
    };
  }

  /**
   * Function that creates a draggable column separator for resizing purposes.
   *
   * @param {Object} col The column to the left of the separator.
   *
   * @return {ReactElement} The created separator element.
   */
  _makeSeparator(col) {
    return (
      <div
        key={`${col.name}_separator`}
        className="fst-separator"
        onMouseDown={this._makeSeparatorHandler(col)}
      />
    );
  }

  /**
   * Resets the filter properties of the column that has the popover currently
   * active.
   */
  _resetFilter() {
    const col = this._columns[this.state.filterPopoverTargetColumnId];
    col.filterProperties = filterPropertiesInitializers[col.filterType](col);

    this.forceUpdate();
  }

  render() {
    const headerRow = (
      <div className="fst-header-row">
        {[].concat(
          ...this._columns.map((col, i) => [
            <div
              key={`${col.name}_column`}
              className="fst-cell"
              style={{ width: `${col.width - 3}px` }}
            >
              {col.displayName || col.name}
              {this._makeColumnControls(col, i)}
            </div>,
            this._makeSeparator(col)
          ])
        )}
      </div>
    );

    const filterPopover = (
      <Popover
        open={this.state.filterPopoverTargetElement !== undefined}
        anchorEl={this.state.filterPopoverTargetElement}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        style={{ padding: '5px', textAlign: 'center', overflow: 'visible' }}
        onClose={this._closeFilterPopover}
      >
        {this.state.filterPopoverTargetColumnId !== undefined
          ? this._makeFilterPopoverContent(
              this.state.filterPopoverTargetColumnId
            )
          : false}

        <Button onClick={this._resetFilter}>
          <ActionSettingsBackupRestore />
          Reset
        </Button>
      </Popover>
    );

    const dataRows = this._data.map(row => (
      <div key={`${this.props.rowIdGenerator(row)}_row`} className="fst-row">
        {this._columns.map(col => (
          <div
            key={`${this.props.rowIdGenerator(row)}_${col.name}_cell`}
            className="fst-cell"
            style={{ width: `${col.width}px` }}
          >
            {col.displayRenderer(col.dataExtractor(row))}
          </div>
        ))}
      </div>
    ));

    const fullWidth = this._columns.reduce(
      (width, col) => width + col.width + 6,
      1
    );

    return (
      <div className="fst-root">
        <div className="fst-container" style={{ minWidth: `${fullWidth}px` }}>
          {headerRow}
          {filterPopover}
          <div className="fst-data-container">{dataRows}</div>
        </div>
      </div>
    );
  }
}

FilterableSortableTable.propTypes = {
  dataSource: PropTypes.array.isRequired,
  rowIdGenerator: PropTypes.func.isRequired,
  availableColumns: PropTypes.array.isRequired,
  defaultColumns: PropTypes.array,
  defaultSortBy: PropTypes.number,
  defaultReverse: PropTypes.bool
};

FilterableSortableTable.defaultProps = {
  rowIdGenerator: row => {
    if (!('id' in row)) {
      throw new Error(
        'FilterableSortableTable: Please include a field named "id"' +
          'in the row objects or provide your own rowIdGenerator implementation!'
      );
    }

    return row.id;
  },
  defaultSortBy: 0,
  defaultReverse: false
};

export default FilterableSortableTable;
