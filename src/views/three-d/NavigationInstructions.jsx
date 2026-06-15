import Mouse from '@mui/icons-material/Mouse';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import PropTypes from 'prop-types';
import React from 'react';
import { Translation, withTranslation } from 'react-i18next';
import { TransitionGroup } from 'react-transition-group';

import FadeAndSlide from '~/components/transitions/FadeAndSlide';

const divStyle = {
  display: 'inline-block',
  transform: 'translateY(1px)',
};

const noWrap = {
  whiteSpace: 'nowrap',
};

const mouseButtonStyle = {
  display: 'inline-block',
  minWidth: 18,
  padding: '0 5px',
  marginRight: 4,
  borderRadius: 4,
  border: '1px solid rgba(255,255,255,0.25)',
  background: 'rgba(255,255,255,0.08)',
  fontSize: 11,
  lineHeight: '18px',
  textAlign: 'center',
  verticalAlign: 'middle',
};

const instructionsByMode = {
  walk: (
    <Translation>
      {(t) => (
        <div style={noWrap}>
          <div style={divStyle}>
            <span style={mouseButtonStyle}>{t('navigationInstructions.rightDrag')}</span>
            <span> {t('navigationInstructions.walkAround')} </span>
            <span style={mouseButtonStyle}>{t('navigationInstructions.middleDrag')}</span>
            <span> {t('navigationInstructions.altitude')} </span>
            <span style={mouseButtonStyle}>{t('navigationInstructions.shiftDrag')}</span>
            <span> {t('navigationInstructions.run')} </span>
          </div>
          <IconButton disabled size='large'>
            <Mouse />
          </IconButton>
          <div style={{ ...divStyle, marginLeft: -8 }}>
            {t('navigationInstructions.leftDragLook')}
          </div>
        </div>
      )}
    </Translation>
  ),

  fly: (
    <Translation>
      {(t) => (
        <div style={noWrap}>
          <div style={divStyle}>
            <span style={mouseButtonStyle}>{t('navigationInstructions.rightDrag')}</span>
            <span> {t('navigationInstructions.flyMove')} </span>
            <span style={mouseButtonStyle}>{t('navigationInstructions.middleDrag')}</span>
            <span> {t('navigationInstructions.altitude')} </span>
          </div>
          <IconButton disabled size='large'>
            <Mouse />
          </IconButton>
          <div style={{ ...divStyle, marginLeft: -8 }}>
            {t('navigationInstructions.leftDragLook')}
          </div>
        </div>
      )}
    </Translation>
  ),
};

/**
 * Component that shows short textual instructions about mouse navigation
 * in the current navigation mode.
 */
const NavigationInstructionsPresentation = ({ mode, t }) => (
  <Box sx={{ mx: 1, flex: 1, alignSelf: 'stretch', position: 'relative' }}>
    <TransitionGroup>
      <FadeAndSlide key={mode}>
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          {instructionsByMode[mode] ||
            t('navigationInstructions.noInstruction')}
        </Box>
      </FadeAndSlide>
    </TransitionGroup>
  </Box>
);

NavigationInstructionsPresentation.propTypes = {
  mode: PropTypes.oneOf(['walk', 'fly']),
  t: PropTypes.func,
};

export default withTranslation()(NavigationInstructionsPresentation);
