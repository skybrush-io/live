import React from 'react';
import wrapDisplayName from 'recompose/wrapDisplayName';

export default BaseComponent =>
  class extends React.Component {
    static displayName = wrapDisplayName(BaseComponent, 'wrapInClassComponent');
    render() {
      return <BaseComponent {...this.props} />;
    }
  };
