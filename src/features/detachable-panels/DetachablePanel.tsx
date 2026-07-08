import Button from '@mui/material/Button';
import PropTypes from 'prop-types';
import React, { type PropsWithChildren, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';

import RestoreWindow from '~/icons/RestoreWindow';
import type { RootState } from '~/store/reducers';

import { isDetached } from './selectors';
import { attachPanel, detachPanel } from './slice';

type Tab = {
  element: HTMLElement[];
  titleElement: HTMLElement[];
};
type GLContainer = {
  tab: Tab;
  on: (event: string, handler: (tab: Tab) => void) => void;
  off: (event: string, handler: (tab: Tab) => void) => void;
};

const getOrCreatePortalContainer = (tab: Tab) => {
  const found = tab.element[0].querySelector('.portal-container');
  if (found !== null) {
    return found;
  } else {
    const portalContainer = document.createElement('div');
    portalContainer.classList.add('portal-container');
    portalContainer.style.display = 'inline-block';
    tab.titleElement[0].after(portalContainer);
    return portalContainer;
  }
};

type DetachButtonPortalProps = {
  glContainer: GLContainer;
  label: string | undefined;
  onClick: () => void;
};

const DetachButtonPortal = ({
  glContainer,
  label,
  onClick,
}: DetachButtonPortalProps) => {
  const [container, setContainer] = useState(() =>
    getOrCreatePortalContainer(glContainer.tab)
  );

  useEffect(() => {
    const tabHandler = (tab: Tab) =>
      setContainer(getOrCreatePortalContainer(tab));
    glContainer.on('tab', tabHandler);
    return () => {
      glContainer.off('tab', tabHandler);
    };
  }, [glContainer]);

  const detachButton = (
    <div
      style={{
        width: '18px',
        height: '18px',
        position: 'relative',
        marginLeft: '5px',
        marginRight: '-10px',
      }}
    >
      <ul className='lm_controls'>
        {/*
          GoldenLayout has a built-in popout feature, which is not suitable for
          our purposes, but we can reuse the icon that would be on the stack.
        */}
        <li
          className='lm_popout'
          title={`Detach ${label} panel`}
          onClick={onClick}
        />
      </ul>
    </div>
  );

  return ReactDOM.createPortal(detachButton, container);
};

type DetachablePanelPresentationProps = PropsWithChildren<{
  detached: boolean;
  glContainer: GLContainer;
  label: string | undefined;
  onAttach: () => void;
  onDetach: () => void;
}>;

const DetachablePanelPresentation = ({
  children,
  detached,
  glContainer,
  label,
  onAttach,
  onDetach,
}: DetachablePanelPresentationProps) => {
  return detached ? (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: '100%',
        textAlign: 'center',
      }}
    >
      <div>
        {label} panel has been detached.
        <div style={{ minHeight: '1em' }} />
        <Button
          variant='outlined'
          startIcon={<RestoreWindow />}
          onClick={onAttach}
        >
          Attach
        </Button>
      </div>
    </div>
  ) : (
    <>
      <DetachButtonPortal
        glContainer={glContainer}
        label={label}
        onClick={onDetach}
      />
      {children}
    </>
  );
};

type DetachablePanelProps = {
  name: string;
};

const DetachablePanel = connect(
  // mapStateToProps
  (state: RootState, ownProps: DetachablePanelProps) => ({
    detached: isDetached(state, ownProps.name),
  }),
  // mapDispatchToProps
  (dispatch, { name }) => ({
    onAttach() {
      dispatch(attachPanel(name));
    },
    onDetach() {
      dispatch(detachPanel(name));
    },
  })
)(DetachablePanelPresentation);

export default DetachablePanel;

export function makeDetachable<P>(
  name: string,
  label: string | undefined,
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return class extends React.Component<P> {
    static propTypes = {
      glContainer: PropTypes.object.isRequired,
    };

    render() {
      // glContainer injected by react-flexible-workbenc
      const { glContainer, ...rest } = this.props as P & {
        glContainer: any;
      };
      return (
        <DetachablePanel {...{ glContainer, name, label }}>
          <Component
            {...(rest as unknown as P & React.JSX.IntrinsicAttributes)}
          />
        </DetachablePanel>
      );
    }
  };
}
