import PropTypes from 'prop-types';
import React from 'react';
import { TransitionGroup } from 'react-transition-group';
import { Translation, withTranslation } from 'react-i18next';

import Box from '@material-ui/core/Box';
import IconButton from '@material-ui/core/IconButton';
import Mouse from '@material-ui/icons/Mouse';

import FadeAndSlide from '~/components/transitions/FadeAndSlide';

const divStyle = {
  display: 'inline-block',
  transform: 'translateY(1px)',
};

const noWrap = {
  whiteSpace: 'nowrap',
};

const instructionsByMode = {
  walk: (
    <Translation>
      {(t) => (
        <div style={noWrap}>
          <div style={divStyle}>
            <kbd>{t('navigationInstructions.arrows')}</kbd>
            <span> {t('navigationInstructions.walkAround')} </span>
            <kbd>E</kbd>
            <kbd>C</kbd>
            <span> {t('navigationInstructions.altitude')} </span>
            <kbd>Shift</kbd>
            <span> {t('navigationInstructions.run')} </span>
          </div>
          <IconButton disabled>
            <Mouse />
          </IconButton>
          <div style={{ ...divStyle, marginLeft: -8 }}>
            {t('navigationInstructions.lookAround')}
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
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <span> {t('navigationInstructions.flyFrwrdBckwrd')} </span>
            <kbd>←</kbd>
            <kbd>→</kbd>
            <span> {t('navigationInstructions.moveSideways')} </span>
            <kbd>E</kbd>
            <kbd>C</kbd>
            <span> {t('navigationInstructions.altitude')} </span>
          </div>
          <IconButton disabled>
            <Mouse />
          </IconButton>
          <div style={{ ...divStyle, marginLeft: -8 }}>
            {t('navigationInstructions.lookAround')}
          </div>
        </div>
      )}
    </Translation>
  ),
};

/**
 * Component that shows some short textual instructions about the hotkeys of the
 * current navigation mode.
 */
const NavigationInstructions = withTranslation()(({ mode, t }) => (
  <Box mx={1} flex={1} alignSelf='stretch' position='relative'>
    <TransitionGroup>
      <FadeAndSlide key={mode}>
        <Box
          position='absolute'
          left={0}
          top={0}
          bottom={0}
          display='flex'
          flexDirection='column'
          justifyContent='center'
        >
          {instructionsByMode[mode] ||
            t('navigationInstructions.noInstruction')}
        </Box>
      </FadeAndSlide>
    </TransitionGroup>
  </Box>
));

NavigationInstructions.propTypes = {
  mode: PropTypes.oneOf(['walk', 'fly']),
  t: PropTypes.func,
};

export default NavigationInstructions;
