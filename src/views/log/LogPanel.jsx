/**
 * @file Component for displaying logged messages.
 */

import padStart from 'lodash-es/padStart';
import property from 'lodash-es/property';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { useEffectOnce } from 'react-use';

import ActionInfo from '@material-ui/icons/Info';
import AlertWarning from '@material-ui/icons/Warning';
import ContentReport from '@material-ui/icons/Report';

import FilterableSortableTable, {
  FilterTypes,
} from '~/components/FilterableSortableTable';
import { updateLogPanelVisibility } from '~/features/log/slice';
import { colorForLogLevel, LogLevel } from '~/utils/logging';

const iconForLogLevel = (level) => {
  const style = {
    color: colorForLogLevel(level),
  };
  if (level <= LogLevel.INFO) {
    return <ActionInfo style={style} />;
  }

  if (level <= LogLevel.WARNING) {
    return <AlertWarning style={style} />;
  }

  return <ContentReport style={style} />;
};

const tableColumns = [
  {
    name: '',
    width: 32,
    dataExtractor: property('level'),
    displayRenderer: iconForLogLevel,
    filterType: FilterTypes.list,
    filterList: Object.keys(LogLevel).map((level) => ({
      value: LogLevel[level],
      display: iconForLogLevel(LogLevel[level]),
    })),
  },
  {
    name: 'Timestamp',
    width: 100,
    dataExtractor: property('timestamp'),
    displayRenderer: (data) => {
      const currentDate = new Date(data);
      return (
        padStart(currentDate.getHours(), 2, '0') +
        ':' +
        padStart(currentDate.getMinutes(), 2, '0') +
        ':' +
        padStart(currentDate.getSeconds(), 2, '0')
      );
    },
    filterType: FilterTypes.range,
  },
  {
    name: 'Message',
    width: 700,
    dataExtractor: property('message'),
    filterType: FilterTypes.text,
  },
];

const LogPanel = ({ items, updateLogPanelVisibility }) => {
  useEffectOnce(() => {
    updateLogPanelVisibility(true);
    return () => updateLogPanelVisibility(false);
  });

  return (
    <FilterableSortableTable
      defaultReverse
      dataSource={items}
      availableColumns={tableColumns}
      defaultSortBy={1}
    />
  );
};

LogPanel.propTypes = {
  items: PropTypes.array,
  updateLogPanelVisibility: PropTypes.func.isRequired,
};

export default connect(
  // mapStateToProps
  (state) => ({
    items: state.log.items,
  }),
  // mapDispatchToProps
  { updateLogPanelVisibility }
)(LogPanel);
