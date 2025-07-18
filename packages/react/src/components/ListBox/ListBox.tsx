/**
 * Copyright IBM Corp. 2016, 2025
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import cx from 'classnames';
import React, {
  forwardRef,
  useContext,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import PropTypes from 'prop-types';
import { deprecate } from '../../prop-types/deprecate';
import {
  ListBoxSizePropType,
  ListBoxTypePropType,
  type ListBoxSize,
  type ListBoxType,
} from '.';
import { usePrefix } from '../../internal/usePrefix';
import { FormContext } from '../FluidForm';

const handleOnKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
  if (event.keyCode === 27) {
    event.stopPropagation();
  }
};

const handleClick = (event: MouseEvent<HTMLDivElement>) => {
  event.preventDefault();
  event.stopPropagation();
};

type ExcludedAttributes = 'onKeyDown' | 'onKeyPress' | 'ref';

export interface ListBoxProps
  extends Omit<HTMLAttributes<HTMLDivElement>, ExcludedAttributes> {
  /**
   * Specify whether the ListBox is currently disabled
   */
  disabled?: boolean;

  /**
   * Specify whether the control is currently invalid
   */
  invalid?: boolean;

  /**
   * Specify the text to be displayed when the control is invalid
   */
  invalidText?: React.ReactNode;

  /**
   * Specify the id to be applied to the element containing the invalid text
   */
  invalidTextId?: string;

  /**
   * Specify if the control should render open
   */
  isOpen?: boolean;

  /**
   * `true` to use the light version. For use on $ui-01 backgrounds only.
   * Don't use this to make tile background color same as container background color.
   *
   * @deprecated The `light` prop for `ListBox` has been deprecated in favor of
   * the new `Layer` component. It will be removed in the next major release.
   */
  light?: boolean;

  /**
   * Specify the size of the ListBox. Currently supports either `sm`, `md` or `lg` as an option.
   */
  size?: ListBoxSize;

  /**
   * Specify the "type" of the ListBox. Currently supports either `default` or
   * `inline` as an option.
   */
  type?: ListBoxType;

  /**
   * Specify whether the control is currently in warning state
   */
  warn?: boolean;

  /**
   * Provide the text that is displayed when the control is in warning state
   */
  warnText?: React.ReactNode;

  /**
   * Specify the id to be applied to the element containing the warn text
   */
  warnTextId?: string;
}

/**
 * `ListBox` is a generic container component that handles creating the
 * container class name in response to certain props.
 */
const ListBox = forwardRef<HTMLDivElement, ListBoxProps>((props, ref) => {
  const {
    children,
    className: containerClassName,
    disabled = false,
    type = 'default',
    size,
    invalid,
    invalidText,
    invalidTextId,
    warn,
    warnText,
    warnTextId,
    light,
    isOpen,
    ...rest
  } = props;
  const prefix = usePrefix();
  const { isFluid } = useContext(FormContext);
  const showWarning = !invalid && warn;

  const className = cx({
    ...(containerClassName && { [containerClassName]: true }),
    [`${prefix}--list-box`]: true,
    [`${prefix}--list-box--${size}`]: size,
    [`${prefix}--list-box--inline`]: type === 'inline',
    [`${prefix}--list-box--disabled`]: disabled,
    [`${prefix}--list-box--light`]: light,
    [`${prefix}--list-box--expanded`]: isOpen,
    [`${prefix}--list-box--invalid`]: invalid,
    [`${prefix}--list-box--warning`]: showWarning,
  });
  return (
    <>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        {...rest}
        className={className}
        ref={ref}
        onKeyDown={handleOnKeyDown}
        onClick={handleClick}
        data-invalid={invalid || undefined}>
        {children}
      </div>
      {isFluid && <hr className={`${prefix}--list-box__divider`} />}
      {invalid ? (
        <div className={`${prefix}--form-requirement`} id={invalidTextId}>
          {invalidText}
        </div>
      ) : null}
      {showWarning ? (
        <div className={`${prefix}--form-requirement`} id={warnTextId}>
          {warnText}
        </div>
      ) : null}
    </>
  );
});

ListBox.displayName = 'ListBox';
ListBox.propTypes = {
  /**
   * Provide the contents of your ListBox
   */
  children: PropTypes.node,

  /**
   * Specify a class name to be applied on the containing list box node
   */
  className: PropTypes.string,

  /**
   * Specify whether the ListBox is currently disabled
   */
  disabled: PropTypes.bool,

  /**
   * Specify whether the control is currently invalid
   */
  invalid: PropTypes.bool,

  /**
   * Specify the text to be displayed when the control is invalid
   */
  invalidText: PropTypes.node,

  /**
   * Specify the id to be applied to the element containing the invalid text
   */
  invalidTextId: PropTypes.string,

  /**
   * Specify if the control should render open
   */
  isOpen: PropTypes.bool,

  /**
   * `true` to use the light version. For use on $ui-01 backgrounds only.
   * Don't use this to make tile background color same as container background color.
   */
  light: deprecate(
    PropTypes.bool,
    'The `light` prop for `ListBox` has ' +
      'been deprecated in favor of the new `Layer` component. It will be removed in the next major release.'
  ),

  /**
   * Specify the size of the ListBox. Currently supports either `sm`, `md` or `lg` as an option.
   */
  size: ListBoxSizePropType,

  /**
   * Specify the "type" of the ListBox. Currently supports either `default` or
   * `inline` as an option.
   */
  type: ListBoxTypePropType,

  /**
   * Specify whether the control is currently in warning state
   */
  warn: PropTypes.bool,

  /**
   * Provide the text that is displayed when the control is in warning state
   */
  warnText: PropTypes.string,

  /**
   * Specify the id to be applied to the element containing the warn text
   */
  warnTextId: PropTypes.string,
};

export default ListBox;
