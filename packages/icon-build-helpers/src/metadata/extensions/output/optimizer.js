/**
 * Copyright IBM Corp. 2018, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const { optimize } = require('svgo');

/**
 * Our SVGO plugin options differ a bit from the defaults, namely in the
 * following areas:
 *
 * 1) We remove the transparent rectangle used for artboard sizes
 * 2) In order to support styling paths inside of an SVG, we offer SVGs that
 *    "punch out" the inner path and include the path as a distinct `<path>`
 *    node. This defaults to `opacity="0"` so that the background color will
 *    bleed through by default. As a result, we disable the opacity rule of
 *    `removeHiddenElems`
 * 3) In order to support consistent inner styling, we let specific ids through
 *    in our `cleanupIDs` plugin so that we can target them in CSS
 */

// Custom plugin to remove transparent rectangles
const removeTransparentRectangle = {
  name: 'removeTransparentRectangle',
  type: 'perItem',
  description: 'removes transparent rectangles used for bounding box',
  fn(item) {
    // Check if this is a group with Transparent_Rectangle id
    if (item.type === 'element' && item.name === 'g') {
      const idAttr = item.attributes?.id;
      if (idAttr && idAttr.value === 'Transparent_Rectangle') {
        return item.children;
      }
    }

    // Check if this element has an id containing Transparent_Rectangle
    if (item.type === 'element' && item.attributes?.id) {
      const idValue = item.attributes.id.value;
      if (idValue.includes('Transparent_Rectangle')) {
        return false; // Remove the element
      }
    }

    // Check for transparent rectangles with specific sizes
    if (item.type === 'element' && item.name === 'rect') {
      const width = item.attributes?.width?.value;
      const height = item.attributes?.height?.value;
      const sizes = ['16', '20', '24', '32', '48'];

      if (width && height && sizes.includes(width) && sizes.includes(height)) {
        return false; // Remove the element
      }
    }

    return item;
  },
};

// Custom plugin to add inner path data attribute
const addInnerPath = {
  name: 'addInnerPath',
  type: 'perItem',
  description: 'map the inner-path id to a corresponding data attribute',
  fn(item) {
    if (
      item.type === 'element' &&
      item.attributes?.id?.value === 'inner-path'
    ) {
      // Remove the id attribute
      delete item.attributes.id;

      // Add the data-icon-path attribute
      if (!item.attributes) {
        item.attributes = {};
      }
      item.attributes['data-icon-path'] = { value: 'inner-path' };
    }
    return item;
  },
};

const plugins = [
  removeTransparentRectangle,
  addInnerPath,
  {
    name: 'inlineStyles',
    params: {
      onlyMatchedOnce: false,
      removeMatchedSelectors: true,
      useMqs: ['', 'screen'],
      usePseudos: [''],
    },
  },
  // Remove the style elements from the SVG
  {
    name: 'removeStyleElement',
  },
  {
    name: 'cleanupAttrs',
  },
  {
    name: 'removeDoctype',
  },
  {
    name: 'removeXMLProcInst',
  },
  {
    name: 'removeComments',
  },
  {
    name: 'removeMetadata',
  },
  {
    // Remove any title tags because titles should be based on the context of
    // the SVG.
    name: 'removeTitle',
  },
  {
    name: 'removeDesc',
  },
  {
    name: 'removeUselessDefs',
  },
  {
    name: 'removeEditorsNSData',
  },
  {
    name: 'removeEmptyAttrs',
  },
  {
    name: 'removeHiddenElems',
    params: {
      // Special case where we don't want to ignore nodes with `opacity="0"`
      opacity0: false,
    },
  },
  {
    name: 'removeEmptyText',
  },
  {
    name: 'removeEmptyContainers',
  },
  {
    name: 'removeViewBox',
    params: false,
  },
  {
    name: 'cleanupEnableBackground',
  },
  {
    name: 'convertStyleToAttrs',
  },
  {
    name: 'convertColors',
  },
  {
    name: 'convertPathData',
    params: false,
  },
  {
    name: 'convertTransform',
  },
  {
    name: 'removeUnknownsAndDefaults',
  },
  {
    name: 'removeNonInheritableGroupAttrs',
  },
  {
    // We disable `stroke` for this plugin as enabling it will cause relevant
    // stroke-* attributes to be removed from the resulting SVG. This can cause
    // issues with pictograms that use stroke attributes for rendering
    // correctly
    name: 'removeUselessStrokeAndFill',
    params: {
      stroke: false,
    },
  },
  {
    name: 'removeUnusedNS',
  },
  {
    name: 'cleanupIds',
    params: {
      preserve: ['inner-path'],
    },
  },
  {
    name: 'cleanupNumericValues',
  },
  {
    name: 'moveGroupAttrsToElems',
  },
  {
    name: 'collapseGroups',
  },
  {
    name: 'removeRasterImages',
    params: false,
  },
  {
    name: 'mergePaths',
  },
  {
    name: 'convertShapeToPath',
  },
  {
    name: 'sortAttrs',
  },
  {
    name: 'removeDimensions',
  },
  {
    // Remove any ids or data attributes that are included in SVG source files.
    name: 'removeAttrs',
    params: {
      attrs: [
        'class',
        'data-name',
        // Remove all fill and stroke attributes where the value is not "none"
        // https://github.com/svg/svgo/pull/977
        '*:(fill|stroke):((?!^none$).)*',
      ],
      // Preserve data-test-id attributes for testing
      preserve: ['data-test-id'],
    },
  },
];

const svgoConfig = {
  plugins,
  multipass: true,
};

// Create a function that uses the new SVGO v4 API
const svgo = {
  optimize: async (svg, options = {}) => {
    const result = await optimize(svg, {
      ...svgoConfig,
      ...options,
    });
    return result;
  },
};

module.exports = {
  svgo,
  plugins,
};
