import BusinessCenter from '@mui/icons-material/BusinessCenter';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { GenericHeaderButton, SidebarBadge } from '@skybrush/mui-components';

import Colors from '~/components/colors';
import { getActiveUAVIdsBeingAveraged } from '~/features/measurement/selectors';

import ToolboxMenu from './ToolboxMenu';

const ToolboxButtonPresentation = ({ numberOfAveragingInProgress }) => {
  const [anchorElement, setAnchorElement] = useState(null);
  const { t } = useTranslation();

  const handleClick = (event) => {
    setAnchorElement(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorElement(null);
  };

  const needsBadge = numberOfAveragingInProgress > 0;

  return (
    <>
      <GenericHeaderButton
        aria-controls='toolbox-menu'
        aria-haspopup='true'
        tooltip={t('toolbox.tooltip')}
        onClick={handleClick}
      >
        <SidebarBadge color={Colors.warning} visible={needsBadge} />
        <BusinessCenter />
      </GenericHeaderButton>
      <ToolboxMenu
        id='toolbox-menu'
        anchorEl={anchorElement}
        open={Boolean(anchorElement)}
        requestClose={handleClose}
        onClose={handleClose}
      />
    </>
  );
};

ToolboxButtonPresentation.propTypes = {
  ...GenericHeaderButton.propTypes,
  numberOfAveragingInProgress: PropTypes.number,
};

export default connect(
  // mapStateToProps
  (state) => ({
    numberOfAveragingInProgress: getActiveUAVIdsBeingAveraged(state).length,
  }),
  // mapDispatchToProps
  null
)(ToolboxButtonPresentation);
