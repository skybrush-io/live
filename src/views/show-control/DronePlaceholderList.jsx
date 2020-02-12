import PropTypes from 'prop-types';
import React from 'react';

import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

import DronePlaceholder from '~/components/uavs/DronePlaceholder';
import { formatMissionId } from '~/utils/formatting';

/**
 * Presentation component that receives a list of drone IDs or mapping slot
 * indices and formats them nicely, truncating the list as appropriate if it
 * is too long.
 */
const DronePlaceholderList = ({
  emptyMessage,
  items = [],
  maxCount,
  successMessage,
  title
}) => (
  <Box mt={1}>
    <Box display="flex" flexDirection="row" alignItems="center" minHeight={44}>
      {title && (
        <Box key="lead" minWidth={85}>
          {title}
        </Box>
      )}
      {items.slice(0, maxCount).map((item, index) => (
        <Box key={item} ml={index > 0 || title ? 1 : 0}>
          <DronePlaceholder
            label={
              typeof item === 'number' ? formatMissionId(item) : String(item)
            }
          />
        </Box>
      ))}
      {items.length > maxCount ? (
        <Box key="more" ml={1} color="text.secondary">
          <Typography variant="body2">
            + {items.length - maxCount} more
          </Typography>
        </Box>
      ) : null}
      {items.length === 0 ? (
        successMessage ? (
          <>
            <Box key="ok" ml={title ? 1 : 0}>
              <DronePlaceholder label="OK" status="success" />
            </Box>
            <Box key="successMessage" color="success.main" ml={1}>
              <Typography variant="body2">{successMessage}</Typography>
            </Box>
          </>
        ) : (
          <Box
            key="emptyMessage"
            color={title ? 'text.secondary' : null}
            ml={title ? 1 : 0}
          >
            <Typography variant="body2">{emptyMessage}</Typography>
          </Box>
        )
      ) : null}
    </Box>
  </Box>
);

DronePlaceholderList.propTypes = {
  emptyMessage: PropTypes.node,
  items: PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.number, PropTypes.string])
  ),
  maxCount: PropTypes.number,
  successMessage: PropTypes.node,
  title: PropTypes.string
};

DronePlaceholderList.defaultProps = {
  maxCount: 8
};

export default DronePlaceholderList;
