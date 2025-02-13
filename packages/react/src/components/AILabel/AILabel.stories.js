/**
 * Copyright IBM Corp. 2016, 2024
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';

import { AILabel, AILabelContent, AILabelActions } from '.';
import { View, FolderOpen, Folders } from '@carbon/icons-react';
import Button from '../Button';
import { IconButton } from '../IconButton';
import mdx from './AILabel.mdx';
import './ailabel-story.scss';

const sizes = ['mini', '2xs', 'xs', 'sm', 'md', 'lg', 'xl'];

const defaultArgs = {
  showAILabelActions: {
    control: {
      type: 'boolean',
    },
    description: 'Playground only - toggle to show the callout toolbar',
  },
  align: {
    options: [
      'top',
      'top-start',
      'top-end',

      'bottom',
      'bottom-start',
      'bottom-end',

      'left',
      'left-end',
      'left-start',

      'right',
      'right-end',
      'right-start',
    ],
    control: { type: 'select' },
  },
  AILabelContent: {
    table: {
      disable: true,
    },
  },
  children: {
    table: {
      disable: true,
    },
  },
  className: {
    table: {
      disable: true,
    },
  },
  onRevertClick: {
    table: {
      disable: true,
    },
  },
  revertActive: {
    table: {
      disable: true,
    },
  },
  revertLabel: {
    table: {
      disable: true,
    },
  },
};

export default {
  title: 'Components/AILabel',
  component: AILabel,
  parameters: {
    docs: {
      page: mdx,
    },
  },
};

export const Default = () => {
  const aiContent = (
    <div>
      <p className="secondary">AI Explained</p>
      <h1>84%</h1>
      <p className="secondary bold">Confidence score</p>
      <p className="secondary">
        Lorem ipsum dolor sit amet, di os consectetur adipiscing elit, sed do
        eiusmod tempor incididunt ut fsil labore et dolore magna aliqua.
      </p>
      <hr />
      <p className="secondary">Model type</p>
      <p className="bold">Foundation model</p>
    </div>
  );

  return (
    <>
      <div className="ai-label-container ai-label-container-example">
        {sizes.map((size, i) => (
          <AILabel autoAlign size={size} key={i}>
            <AILabelContent>{aiContent}</AILabelContent>
          </AILabel>
        ))}
      </div>
      <div className="ai-label-container ai-label-container-example">
        {sizes.slice(3, 6).map((size, i) => (
          <AILabel autoAlign kind="inline" size={size} key={i}>
            <AILabelContent>
              {aiContent}
              <AILabelActions>
                <IconButton kind="ghost" label="View">
                  <View />
                </IconButton>
                <IconButton kind="ghost" label="Open Folder">
                  <FolderOpen />
                </IconButton>
                <IconButton kind="ghost" label="Folders">
                  <Folders />
                </IconButton>
                <Button>View details</Button>
              </AILabelActions>
            </AILabelContent>
          </AILabel>
        ))}
      </div>
      <div className="ai-label-container ai-label-container-example">
        {sizes.slice(3, 6).map((size, i) => (
          <AILabel
            autoAlign
            kind="inline"
            size={size}
            key={i}
            textLabel="Text goes here">
            <AILabelContent>
              {aiContent}
              <AILabelActions>
                <IconButton kind="ghost" label="View">
                  <View />
                </IconButton>
                <IconButton kind="ghost" label="Open Folder">
                  <FolderOpen />
                </IconButton>
                <IconButton kind="ghost" label="Folders">
                  <Folders />
                </IconButton>
                <Button>View details</Button>
              </AILabelActions>
            </AILabelContent>
          </AILabel>
        ))}
      </div>
    </>
  );
};

export const ExplainabilityPopover = (args) => {
  const { showAILabelActions = true } = args;

  return (
    <div className="ai-label-container-example ai-label-container centered">
      <AILabel autoAlign={false} defaultOpen {...args}>
        <AILabelContent>
          {' '}
          <div>
            <p className="secondary">AI Explained</p>
            <h1>84%</h1>
            <p className="secondary bold">Confidence score</p>
            <p className="secondary">
              Lorem ipsum dolor sit amet, di os consectetur adipiscing elit, sed
              do eiusmod tempor incididunt ut fsil labore et dolore magna
              aliqua.
            </p>
            <hr />
            <p className="secondary">Model type</p>
            <p className="bold">Foundation model</p>
          </div>
          {showAILabelActions && (
            <AILabelActions>
              <IconButton kind="ghost" label="View">
                <View />
              </IconButton>
              <IconButton kind="ghost" label="Open Folder">
                <FolderOpen />
              </IconButton>
              <IconButton kind="ghost" label="Folders">
                <Folders />
              </IconButton>
              <Button>View details</Button>
            </AILabelActions>
          )}
        </AILabelContent>
      </AILabel>
    </div>
  );
};

ExplainabilityPopover.argTypes = {
  ...defaultArgs,
  aiText: {
    table: {
      disable: true,
    },
  },
  aiTextLabel: {
    table: {
      disable: true,
    },
  },
  autoAlign: {
    table: {
      disable: true,
    },
  },
  kind: {
    table: {
      disable: true,
    },
  },
  size: {
    table: {
      disable: true,
    },
  },
  slugContent: {
    table: {
      disable: true,
    },
  },
  slugLabel: {
    table: {
      disable: true,
    },
  },
  textLabel: {
    table: {
      disable: true,
    },
  },
};

export const Playground = (args) => {
  const { showAILabelActions = true } = args;

  const renderedContent = (
    <>
      <div>
        <p className="secondary">AI Explained</p>
        <h1>84%</h1>
        <p className="secondary bold">Confidence score</p>
        <p className="secondary">
          Lorem ipsum dolor sit amet, di os consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut fsil labore et dolore magna aliqua.
        </p>
        <hr />
        <p className="secondary">Model type</p>
        <p className="bold">Foundation model</p>
      </div>
      {showAILabelActions && (
        <AILabelActions>
          <IconButton kind="ghost" label="View">
            <View />
          </IconButton>
          <IconButton kind="ghost" label="Open Folder">
            <FolderOpen />
          </IconButton>
          <IconButton kind="ghost" label="Folders">
            <Folders />
          </IconButton>
          <Button>View details</Button>
        </AILabelActions>
      )}
    </>
  );

  return (
    <>
      <div className="ai-label-container ai-label-container-example">
        <AILabel aria-label="Test" {...args}>
          <AILabelContent>{renderedContent}</AILabelContent>
        </AILabel>
      </div>
      <Button>Test</Button>
      <Button kind="danger">Test</Button>
    </>
  );
};

Playground.argTypes = {
  ...defaultArgs,
};
