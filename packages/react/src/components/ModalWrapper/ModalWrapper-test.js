/**
 * Copyright IBM Corp. 2016, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ModalWrapper from '../ModalWrapper';

describe('ModalWrapper', () => {
  it('should default to primary button', () => {
    render(
      <ModalWrapper
        buttonTriggerText="Launch modal"
        modalHeading="Modal heading"
        modalLabel="Label">
        <p>Modal content here</p>
      </ModalWrapper>
    );

    expect(screen.getByText('Save')).toHaveClass('cds--btn--primary');
  });

  it('should render danger button when danger is passed', () => {
    render(
      <ModalWrapper
        buttonTriggerText="Launch modal"
        modalHeading="Modal heading"
        modalLabel="Label"
        danger>
        <p>Modal content here</p>
      </ModalWrapper>
    );

    expect(screen.getByText('Save')).toHaveClass('cds--btn--danger');
  });

  it('should render a secondary button by default', () => {
    render(
      <ModalWrapper
        buttonTriggerText="Launch modal"
        modalHeading="Modal heading"
        modalLabel="Label"
        danger>
        <p>Modal content here</p>
      </ModalWrapper>
    );

    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should not render a secondary button if text is explicitly null', () => {
    render(
      <ModalWrapper
        buttonTriggerText="Launch modal"
        modalHeading="Modal heading"
        modalLabel="Label"
        secondaryButtonText={null}
        danger>
        <p>Modal content here</p>
      </ModalWrapper>
    );

    expect(screen.queryByText('Cancel')).not.toBeInTheDocument();
  });

  it('should set state to open when trigger button is clicked', async () => {
    render(
      <ModalWrapper
        buttonTriggerText="Launch modal"
        modalHeading="Modal heading"
        modalLabel="Label"
        data-testid="modal-1">
        <p>Modal content here</p>
      </ModalWrapper>
    );

    const triggerBtn = screen.getByText('Launch modal');
    expect(screen.getByTestId('modal-1')).not.toHaveClass('is-visible');
    await userEvent.click(triggerBtn);
    expect(screen.getByTestId('modal-1')).toHaveClass('is-visible');
  });

  it('should set open state to false when escape is pressed', async () => {
    render(
      <ModalWrapper
        buttonTriggerText="Launch modal"
        modalHeading="Modal heading"
        modalLabel="Label"
        data-testid="modal-2">
        <p>Modal content here</p>
      </ModalWrapper>
    );

    const triggerBtn = screen.getByText('Launch modal');
    await userEvent.click(triggerBtn);
    expect(screen.getByTestId('modal-2')).toHaveClass('is-visible');
    await userEvent.keyboard('{Escape}');
    expect(screen.getByTestId('modal-2')).not.toHaveClass('is-visible');
  });

  it('should call onKeyDown with escape', async () => {
    const onKeyDown = jest.fn();
    render(
      <ModalWrapper
        buttonTriggerText="Launch modal"
        modalHeading="Modal heading"
        modalLabel="Label"
        data-testid="modal-2"
        onKeyDown={onKeyDown}>
        <p>Modal content here</p>
      </ModalWrapper>
    );

    await userEvent.tab();
    await userEvent.keyboard('{Escape}');
    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it('should set open state to false when close button is clicked', async () => {
    render(
      <ModalWrapper
        buttonTriggerText="Launch modal"
        modalHeading="Modal heading"
        modalLabel="Label"
        data-testid="modal-3">
        <p>Modal content here</p>
      </ModalWrapper>
    );

    const triggerBtn = screen.getByText('Launch modal');
    // eslint-disable-next-line testing-library/no-node-access
    const closeBtn = document.querySelector('.cds--modal-close');
    await userEvent.click(triggerBtn);
    expect(screen.getByTestId('modal-3')).toHaveClass('is-visible');
    await userEvent.click(closeBtn);
    expect(screen.getByTestId('modal-3')).not.toHaveClass('is-visible');
  });

  it('should set open state to false when secondary button is clicked', async () => {
    render(
      <ModalWrapper
        buttonTriggerText="Launch modal"
        modalHeading="Modal heading"
        modalLabel="Label"
        data-testid="modal-4">
        <p>Modal content here</p>
      </ModalWrapper>
    );

    const triggerBtn = screen.getByText('Launch modal');
    const cancelBtn = screen.getByText('Cancel');
    await userEvent.click(triggerBtn);
    expect(screen.getByTestId('modal-4')).toHaveClass('is-visible');
    await userEvent.click(cancelBtn);
    expect(screen.getByTestId('modal-4')).not.toHaveClass('is-visible');
  });

  it('should close after a successful submit action', async () => {
    const handleSubmit = jest.fn();
    render(
      <ModalWrapper
        buttonTriggerText="Launch modal"
        modalHeading="Modal heading"
        modalLabel="Label"
        handleSubmit={handleSubmit}
        shouldCloseAfterSubmit
        open
        data-testid="modal-5">
        <p>Modal content here</p>
      </ModalWrapper>
    );

    const submitBtn = screen.getByText('Save');
    await userEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalled();
    expect(screen.getByTestId('modal-5')).not.toHaveClass('is-visible');
  });

  it('should return focus to the trigger button after closing', async () => {
    const handleSubmit = jest.fn();
    render(
      <ModalWrapper
        buttonTriggerText="Launch modal"
        modalHeading="Modal heading"
        modalLabel="Label"
        handleSubmit={handleSubmit}
        open>
        <p>Modal content here</p>
      </ModalWrapper>
    );

    const triggerBtn = screen.getByText('Launch modal');
    const submitBtn = screen.getByText('Save');
    await userEvent.click(submitBtn);

    expect(handleSubmit).toHaveBeenCalled();
    setTimeout(() => {
      expect(triggerBtn).toHaveFocus();
    }, 0);
  });
});
