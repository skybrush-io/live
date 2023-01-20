import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';

import { ContainerContext } from '~/containerContext';

export default class ExternalWindow extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    height: PropTypes.number,
    left: PropTypes.number,
    onClose: PropTypes.func,
    title: PropTypes.string,
    top: PropTypes.number,
    width: PropTypes.number,
  };

  static defaultProps = {
    height: 400,
    left: 100,
    title: 'Untitled',
    top: 100,
    width: 600,
  };

  constructor() {
    super();

    this._container = document.createElement('div');
    this._externalWindow = null;
    this._mutationObserver = null;
    this._styleRegistry = new Map();
  }

  componentDidMount() {
    const { height, left, top, width } = this.props;
    this._externalWindow = window.open(
      `about:blank#${this.props.title}`,
      '',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    this._externalWindow.document.title = this.props.title;

    this._copyAndFollowStyles();

    this._externalWindow.document.body.append(this._container);

    // TODO: Using the 'unload' event is not recommended:
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/unload_event
    this._externalWindow.addEventListener('unload', this.props.onClose);
    // Force the execution of `componentWillUnmount` even when refreshing or
    // closing a tab or window in order to properly close external windows.
    window.addEventListener('unload', this.componentWillUnmount.bind(this));
  }

  componentWillUnmount() {
    if (!this._externalWindow.closed) {
      this._externalWindow.close();
    }

    this._mutationObserver.disconnect();
  }

  render() {
    return ReactDOM.createPortal(
      <ContainerContext.Provider value={this._container}>
        {this.props.children}
      </ContainerContext.Provider>,
      this._container
    );
  }

  _copyAndFollowStyles() {
    // Import a style node with its rules to the external window's head.
    const importStyleNode = (
      styleNode,
      importer = (node) => this._externalWindow.document.head.append(node)
    ) => {
      const clone = this._externalWindow.document.importNode(styleNode, true);
      importer(clone);

      for (const cssRule of styleNode.sheet.cssRules) {
        clone.sheet.insertRule(cssRule.cssText);
      }

      return clone;
    };

    // Find the closest element that has a known counterpart in the external
    // window and create an importer that will import items before that one.
    //
    // If next is null (the mutation happened at the end of the child list or
    // no known element is found), fall back to the appending to the head.
    const makeImporterBefore = (next) => {
      if (next === null) {
        return undefined;
      }

      return this._styleRegistry.has(next)
        ? (node) => this._styleRegistry.get(next).before(node)
        : makeImporterBefore(next.nextElementSibling);
    };

    for (const styleSheet of document.styleSheets) {
      this._styleRegistry.set(
        styleSheet.ownerNode,
        importStyleNode(styleSheet.ownerNode)
      );
    }

    // Subscribe to changes in the main window's head and keep the external
    // window's style elements in sync by copying the modifications.
    this._mutationObserver = new MutationObserver((mutationList, _observer) => {
      for (const mutation of mutationList) {
        for (const removed of mutation.removedNodes) {
          if (this._styleRegistry.has(removed)) {
            this._styleRegistry.get(removed).remove();
            this._styleRegistry.delete(removed);
          }
        }

        const importer = makeImporterBefore(mutation.nextSibling);
        for (const added of mutation.addedNodes) {
          if (added instanceof HTMLStyleElement && added.sheet) {
            this._styleRegistry.set(added, importStyleNode(added, importer));
          }
        }
      }
    });
    this._mutationObserver.observe(document.head, { childList: true });
  }
}
