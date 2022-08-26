import PropTypes from 'prop-types';
import React from 'react';
import ReactDOM from 'react-dom';

// Code originally adapted from:
// https://medium.com/hackernoon/using-a-react-16-portal-to-do-something-cool-2a2d627b0202

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
  }

  componentDidMount() {
    const { height, left, top, width } = this.props;
    this._externalWindow = window.open(
      `about:blank#${this.props.title}`,
      '',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    this._externalWindow.document.title = this.props.title;

    for (const styleSheet of document.styleSheets) {
      if (styleSheet.cssRules) {
        // for <style> elements
        const style = document.createElement('style');

        for (const cssRule of Array.from(styleSheet.cssRules)) {
          // write the text of each rule into the body of the style element
          style.append(document.createTextNode(cssRule.cssText));
        }

        this._externalWindow.document.head.append(style);
      } else if (styleSheet.href) {
        // for <link> elements loading CSS from a URL
        const link = document.createElement('link');

        link.rel = 'stylesheet';
        link.href = styleSheet.href;
        this._externalWindow.document.head.append(link);
      }
    }

    this._externalWindow.document.body.append(this._container);

    // TODO: Using the 'unload' event is not recommended:
    // https://developer.mozilla.org/en-US/docs/Web/API/Window/unload_event
    this._externalWindow.addEventListener('unload', this.props.onClose);
  }

  componentWillUnmount() {
    if (!this._externalWindow.closed) {
      this._externalWindow.close();
    }
  }

  render() {
    return ReactDOM.createPortal(this.props.children, this._container);
  }
}
