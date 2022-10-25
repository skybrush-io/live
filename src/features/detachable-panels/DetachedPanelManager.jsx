import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import ExternalWindow from './ExternalWindow';
import { detachedPanels } from './selectors';
import { attachPanel } from './slice';

import { componentRegistry } from '~/workbench.js';

const DetachedPanelManagerPresentation = ({ attachPanel, detachedPanels }) =>
  detachedPanels.map((name) => {
    const { component: Component, label } = componentRegistry[name];
    const attach = () => attachPanel(name);
    return (
      <ExternalWindow key={name} title={label} onClose={attach}>
        <Component />
      </ExternalWindow>
    );
  });

DetachedPanelManagerPresentation.propTypes = {
  attachPanel: PropTypes.func.isRequired,
  detachedPanels: PropTypes.arrayOf(PropTypes.string),
};

const DetachedPanelManager = connect(
  // mapStateToProps
  (state) => ({
    detachedPanels: detachedPanels(state),
  }),
  // mapDispatchToProps
  { attachPanel }
)(DetachedPanelManagerPresentation);

export default DetachedPanelManager;
