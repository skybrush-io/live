import React from 'react'
import { getDisplayName, wrapDisplayName } from 'recompose'

const wrapWith = WrapperComponent =>
  BaseComponent => {
    const result = (children, ...restProps) => (
      <WrapperComponent>
        <BaseComponent {...restProps}>
          {children}
        </BaseComponent>
      </WrapperComponent>
    )
    result.displayName = wrapDisplayName(BaseComponent,
      'wrapWith[' + getDisplayName(WrapperComponent) + ']'
    )
    return result
  }

export default wrapWith
