import PropTypes from 'prop-types';
import React, { useState } from 'react';

import Button from '@material-ui/core/Button';
import InsertLink from '@material-ui/icons/InsertLink';
import LinkOff from '@material-ui/icons/LinkOff';

import ExternalWindow from '~/components/ExternalWindow';

const DetachablePanel = ({ children, title }) => {
  const [detached, setDetached] = useState(false);

  return (
    <>
      <Button
        startIcon={detached ? <InsertLink /> : <LinkOff />}
        onClick={() => setDetached(!detached)}
      >
        {detached ? 'Attach' : 'Detach'}
      </Button>
      <div style={{ position: 'relative' }}>
        {detached ? (
          <>
            {title} dialog has been undocked.
            <ExternalWindow title={title} onClose={() => setDetached(false)}>
              {children}
            </ExternalWindow>
          </>
        ) : (
          children
        )}
      </div>
    </>
  );
};

DetachablePanel.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
};

DetachablePanel.defaultProps = {};

export const makeDetachable = (Component, title) =>
  class extends React.Component {
    render() {
      return (
        <DetachablePanel title={title}>
          <Component {...this.props} />
        </DetachablePanel>
      );
    }
  };

export default DetachablePanel;
