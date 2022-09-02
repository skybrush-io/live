import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';

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

    const importStyleNode = (
      styleNode,
      importer = (node) => this._externalWindow.document.head.append(node)
    ) => {
      const clone = this._externalWindow.document.importNode(styleNode, true);
      this._styleRegistry.set(styleNode, clone);
      importer(clone);

      for (const cssRule of styleNode.sheet.cssRules) {
        clone.sheet.insertRule(cssRule.cssText);
      }
    };

    for (const styleSheet of document.styleSheets) {
      importStyleNode(styleSheet.ownerNode);
    }

    this._observer = new MutationObserver((_mutationList, _observer) => {
      let latest = undefined;
      for (const styleSheet of document.styleSheets) {
        if (this._styleRegistry.has(styleSheet.ownerNode)) {
          latest = this._styleRegistry.get(styleSheet.ownerNode);
        } else {
          if (latest) {
            importStyleNode(styleSheet.ownerNode, (node) => latest.after(node));
          } else {
            importStyleNode(styleSheet.ownerNode);
          }
        }
      }
    });
    this._observer.observe(document.head, { childList: true });

    this._externalWindow.document.body.append(this._container);

    // TODO: Using the 'unload' event is not recommended:
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/unload_event
    this._externalWindow.addEventListener('unload', this.props.onClose);
  }

  componentWillUnmount() {
    if (!this._externalWindow.closed) {
      this._externalWindow.close();
    }

    this._observer.disconnect();
  }

  render() {
    return ReactDOM.createPortal(this.props.children, this._container);
  }
}
