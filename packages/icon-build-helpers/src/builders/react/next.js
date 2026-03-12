/**
 * Copyright IBM Corp. 2019, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const babel = require('@babel/core');
const fs = require('fs-extra');
const path = require('path');
const ts = require('typescript');
const { babelConfig } = require('./next/babel');
const templates = require('./next/templates');
const { writeTsDefinitions } = require('./next/typescript');

/**
 * Process items in chunks to limit concurrent I/O and memory usage.
 */
async function processInChunks(items, chunkSize, fn) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await Promise.all(chunk.map(fn));
  }
}

async function builder(metadata, { output }) {
  const modules = metadata.icons.map((icon) => {
    const { moduleInfo } = icon;
    return {
      filepath: moduleInfo.filepath,
      name: moduleInfo.global,
      local: moduleInfo.local,
      sizes: moduleInfo.sizes,
      deprecated: icon.deprecated,
      reason: icon.reason,
    };
  });

  const esDir = path.join(output, 'es');
  const libDir = path.join(output, 'lib');
  await fs.ensureDir(esDir);
  await fs.ensureDir(libDir);

  // Compile Icon.tsx once with Babel (same presets Rollup was using)
  const iconTsxSource = await fs.readFile(
    path.resolve(__dirname, './components/Icon.tsx'),
    'utf8'
  );
  // Compile Icon.tsx for ESM (preserve imports/exports)
  const iconEs = babel.transformSync(iconTsxSource, {
    babelrc: false,
    filename: 'Icon.tsx',
    presets: [
      ['@babel/preset-env', { modules: false }],
      '@babel/preset-react',
      '@babel/preset-typescript',
    ],
    plugins: babelConfig.plugins,
  });

  // Compile Icon.tsx for CJS (convert to CommonJS)
  const iconCjs = babel.transformSync(iconTsxSource, {
    babelrc: false,
    filename: 'Icon.tsx',
    presets: babelConfig.presets,
    plugins: babelConfig.plugins,
  });

  await Promise.all([
    fs.writeFile(
      path.join(esDir, 'Icon.js'),
      `${templates.banner}\n${iconEs.code}\n`,
      'utf8'
    ),
    fs.writeFile(
      path.join(libDir, 'Icon.js'),
      `${templates.banner}\n${iconCjs.code}\n`,
      'utf8'
    ),
  ]);

  // Write iconPropTypes module
  const iconPropTypesEs = [
    templates.banner,
    `import PropTypes from 'prop-types';`,
    '',
    'export const iconPropTypes = {',
    '  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),',
    '};',
    '',
  ].join('\n');

  const iconPropTypesCjs = [
    templates.banner,
    `'use strict';`,
    '',
    `var PropTypes = require('prop-types');`,
    '',
    'const iconPropTypes = {',
    '  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),',
    '};',
    '',
    'exports.iconPropTypes = iconPropTypes;',
    '',
  ].join('\n');

  await Promise.all([
    fs.writeFile(path.join(esDir, 'iconPropTypes.js'), iconPropTypesEs, 'utf8'),
    fs.writeFile(
      path.join(libDir, 'iconPropTypes.js'),
      iconPropTypesCjs,
      'utf8'
    ),
  ]);

  // Build bucket structure (same BUCKET_SIZE as before)
  const BUCKET_SIZE = 125;
  const buckets = [];
  for (let i = 0; i < modules.length; i += BUCKET_SIZE) {
    buckets.push({
      id: `bucket-${buckets.length}`,
      modules: modules.slice(i, i + BUCKET_SIZE),
    });
  }

  // Write individual icon entry point files directly to disk
  const CHUNK_SIZE = 200;
  await processInChunks(modules, CHUNK_SIZE, async (m) => {
    const esSource = generateIconEntrypoint(m, 'esm');
    const cjsSource = generateIconEntrypoint(m, 'cjs');

    const esFile = path.join(esDir, m.filepath);
    const libFile = path.join(libDir, m.filepath);

    await Promise.all([
      fs.ensureFile(esFile).then(() => fs.writeFile(esFile, esSource, 'utf8')),
      fs
        .ensureFile(libFile)
        .then(() => fs.writeFile(libFile, cjsSource, 'utf8')),
    ]);
  });

  // Write bucket files directly to disk
  await fs.ensureDir(path.join(esDir, 'generated'));
  await fs.ensureDir(path.join(libDir, 'generated'));

  for (const bucket of buckets) {
    const esBucket = generateBucketFile(bucket, 'esm');
    const cjsBucket = generateBucketFile(bucket, 'cjs');

    await Promise.all([
      fs.writeFile(
        path.join(esDir, `generated/${bucket.id}.js`),
        esBucket,
        'utf8'
      ),
      fs.writeFile(
        path.join(libDir, `generated/${bucket.id}.js`),
        cjsBucket,
        'utf8'
      ),
    ]);
  }

  // Write barrel index.js
  const esIndex = [
    templates.banner,
    `export { default as Icon } from './Icon.js';`,
    ...buckets.map((b) => `export * from './generated/${b.id}.js';`),
    '',
  ].join('\n');

  const libIndex = [
    templates.banner,
    `'use strict';`,
    '',
    `var Icon_js = require('./Icon.js');`,
    ...buckets.map(
      (b) =>
        `var ${b.id.replace(/-/g, '_')} = require('./generated/${b.id}.js');`
    ),
    '',
    `exports.Icon = Icon_js;`,
    ...buckets.map(
      (b) =>
        `Object.keys(${b.id.replace(/-/g, '_')}).forEach(function (k) { if (k !== 'default' && !Object.prototype.hasOwnProperty.call(exports, k)) exports[k] = ${b.id.replace(/-/g, '_')}[k]; });`
    ),
    '',
  ].join('\n');

  await Promise.all([
    fs.writeFile(path.join(esDir, 'index.js'), esIndex, 'utf8'),
    fs.writeFile(path.join(libDir, 'index.js'), libIndex, 'utf8'),
  ]);

  // Write TypeScript definition files (reuses existing logic)
  const tsModules = modules.map((m) => ({
    filepath: m.filepath,
    name: m.name,
  }));
  const targets = [
    { directory: esDir, tsModuleKind: ts.ModuleKind.ESNext },
    { directory: libDir, tsModuleKind: ts.ModuleKind.CommonJS },
  ];

  for (const target of targets) {
    writeTsDefinitions(
      tsModules,
      buckets,
      target.tsModuleKind,
      target.directory
    );
  }
}

/**
 * Generate a React icon component entry point as a string.
 */
function generateIconEntrypoint(icon, format) {
  const lines = [templates.banner];

  if (format === 'esm') {
    lines.push(
      `import React from 'react';`,
      `import Icon from './Icon.js';`,
      `import { iconPropTypes } from './iconPropTypes.js';`
    );
  } else {
    lines.push(
      `'use strict';`,
      '',
      `var React = require('react');`,
      `var Icon = require('./Icon.js');`,
      `var iconPropTypes_mod = require('./iconPropTypes.js');`
    );
  }

  lines.push('');

  if (icon.deprecated) {
    lines.push('let didWarnAboutDeprecation = false;');
  }

  const { varDecls, componentBody } = generateComponentBody(
    icon.local,
    icon.sizes,
    icon.deprecated,
    icon.reason,
    format,
    0,
    0,
    false
  );

  if (varDecls.length > 0) {
    lines.push(`var ${varDecls.join(', ')};`);
  }

  lines.push(...componentBody);
  lines.push('');

  if (format === 'esm') {
    lines.push(`export { ${icon.local} as default };`, '');
  } else {
    lines.push(`module.exports = ${icon.local};`, '');
  }

  return lines.join('\n');
}

/**
 * Generate a bucket file containing multiple icon components.
 */
function generateBucketFile(bucket, format) {
  const lines = [templates.banner];

  if (format === 'esm') {
    lines.push(
      `import React from 'react';`,
      `import Icon from '../Icon.js';`,
      `import { iconPropTypes } from '../iconPropTypes.js';`
    );
  } else {
    lines.push(
      `'use strict';`,
      '',
      `var React = require('react');`,
      `var Icon = require('../Icon.js');`,
      `var iconPropTypes_mod = require('../iconPropTypes.js');`
    );
  }

  lines.push('');

  // Check if any icon in this bucket is deprecated
  const hasAnyDeprecated = bucket.modules.some((m) => m.deprecated);
  if (hasAnyDeprecated) {
    lines.push('const didWarnAboutDeprecation = {};');
  }

  const allVarDecls = [];
  const allComponents = [];
  const exportNames = [];
  let pathCounter = 0;
  let circleCounter = 0;

  for (const m of bucket.modules) {
    const { varDecls, componentBody, nextPathCounter, nextCircleCounter } =
      generateComponentBody(
        m.name,
        m.sizes,
        m.deprecated,
        m.reason,
        format,
        pathCounter,
        circleCounter,
        true
      );
    allVarDecls.push(...varDecls);
    allComponents.push(...componentBody);
    exportNames.push(m.name);
    pathCounter = nextPathCounter;
    circleCounter = nextCircleCounter;
  }

  if (allVarDecls.length > 0) {
    lines.push(`var ${allVarDecls.join(', ')};`);
  }

  lines.push('');
  lines.push(...allComponents);

  if (format === 'esm') {
    lines.push(`export { ${exportNames.join(', ')} };`, '');
  } else {
    for (const name of exportNames) {
      lines.push(`exports.${name} = ${name};`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Generate the component body for a single icon.
 */
function generateComponentBody(
  moduleName,
  sizes,
  deprecated,
  reason,
  format,
  pathCounterStart,
  circleCounterStart,
  isBucket
) {
  let pathCounter = pathCounterStart;
  let circleCounter = circleCounterStart;
  const varDecls = [];
  const lines = [];

  const propTypesRef =
    format === 'esm' ? 'iconPropTypes' : 'iconPropTypes_mod.iconPropTypes';

  // Process size variants
  const sizeVariants = sizes.map(({ size, ast }) => {
    const svgProps = {};
    for (const [key, value] of Object.entries(ast.attributes || {})) {
      svgProps[key] = value;
    }
    const children = ast.children || [];
    const childElements = [];

    for (const child of children) {
      const { code, decls, pc, cc } = generateChildElement(
        child,
        pathCounter,
        circleCounter
      );
      childElements.push(code);
      varDecls.push(...decls);
      pathCounter = pc;
      circleCounter = cc;
    }

    return { size: size || 'glyph', svgProps, childElements };
  });

  // Find max size (default)
  const maxSize = sizeVariants.reduce((max, v) => {
    return v.size > max ? v.size : max;
  }, -Infinity);

  const ifVariants = sizeVariants.filter((v) => v.size !== maxSize);
  const defaultVariant =
    sizeVariants.find((v) => v.size === maxSize) || sizeVariants[0];

  lines.push(
    `const ${moduleName} = /*#__PURE__*/React.forwardRef(function ${moduleName}({`,
    `  children,`,
    `  size = 16,`,
    `  ...rest`,
    `}, ref) {`
  );

  // Deprecation warning
  if (deprecated) {
    const warning = JSON.stringify(
      formatDeprecationWarning(moduleName, reason)
    );
    if (isBucket) {
      lines.push(
        `  if (process.env.NODE_ENV !== "production") {`,
        `    if (!didWarnAboutDeprecation["${moduleName}"]) {`,
        `      didWarnAboutDeprecation["${moduleName}"] = true;`,
        `      console.warn(${warning});`,
        `    }`,
        `  }`
      );
    } else {
      lines.push(
        `  if (process.env.NODE_ENV !== "production") {`,
        `    if (!didWarnAboutDeprecation) {`,
        `      didWarnAboutDeprecation = true;`,
        `      console.warn(${warning});`,
        `    }`,
        `  }`
      );
    }
  }

  // Size-specific if statements
  for (const variant of ifVariants) {
    lines.push(
      `  if (size === ${variant.size} || size === "${variant.size}" || size === "${variant.size}px") {`
    );
    lines.push(
      `    return ${generateCreateElement(variant.svgProps, variant.childElements)};`
    );
    lines.push(`  }`);
  }

  // Default return
  lines.push(
    `  return ${generateCreateElement(defaultVariant.svgProps, defaultVariant.childElements)};`
  );

  lines.push(`});`);
  lines.push(
    `if (process.env.NODE_ENV !== "production") {`,
    `  ${moduleName}.propTypes = ${propTypesRef};`,
    `}`
  );

  return {
    varDecls,
    componentBody: lines,
    nextPathCounter: pathCounter,
    nextCircleCounter: circleCounter,
  };
}

/**
 * Generate React.createElement call for an Icon with SVG props and children.
 */
function generateCreateElement(svgProps, childElements) {
  const propsEntries = [`width: size`, `height: size`, `ref: ref`];

  for (const [key, value] of Object.entries(svgProps)) {
    const jsxKey = svgAttrToJsx(key);
    propsEntries.push(`${quoteKey(jsxKey)}: ${JSON.stringify(value)}`);
  }

  propsEntries.push(`...rest`);

  const childrenStr =
    childElements.length > 0 ? childElements.join(', ') + ', ' : '';

  return `/*#__PURE__*/React.createElement(Icon, {${propsEntries.join(', ')}}, ${childrenStr}children)`;
}

/**
 * Generate a React.createElement call for a child SVG element with the
 * _path || (_path = ...) caching pattern.
 */
function generateChildElement(node, pathCounter, circleCounter) {
  if (node.type !== 'element') {
    return { code: 'null', decls: [], pc: pathCounter, cc: circleCounter };
  }

  const tagName = node.tagName;
  const attrs = {};
  const decls = [];

  // Filter attributes (same logic as the original svgToJSX)
  const attributeAllowlist = new Set(['data-icon-path']);
  const attributeDenylist = ['data', 'aria'];

  for (const [key, value] of Object.entries(node.attributes || {})) {
    if (attributeAllowlist.has(key)) {
      attrs[key] = value;
    } else if (!attributeDenylist.some((prefix) => key.startsWith(prefix))) {
      attrs[svgAttrToJsx(key)] = value;
    }
  }

  const attrsStr = Object.entries(attrs)
    .map(([k, v]) => `${quoteKey(k)}: ${JSON.stringify(v)}`)
    .join(', ');

  // Determine variable name for caching
  let varName;
  if (tagName === 'circle') {
    circleCounter++;
    varName = circleCounter === 1 ? '_circle' : `_circle${circleCounter}`;
    decls.push(varName);
  } else {
    pathCounter++;
    varName = pathCounter === 1 ? '_path' : `_path${pathCounter}`;
    decls.push(varName);
  }

  let code;
  if (node.children && node.children.length > 0) {
    const childCodes = [];
    let pc = pathCounter;
    let cc = circleCounter;
    for (const child of node.children) {
      const result = generateChildElement(child, pc, cc);
      childCodes.push(result.code);
      decls.push(...result.decls);
      pc = result.pc;
      cc = result.cc;
    }
    pathCounter = pc;
    circleCounter = cc;
    code = `${varName} || (${varName} = /*#__PURE__*/React.createElement("${tagName}", {${attrsStr}}, ${childCodes.join(', ')}))`;
  } else {
    code = `${varName} || (${varName} = /*#__PURE__*/React.createElement("${tagName}", {${attrsStr}}))`;
  }

  return { code, decls, pc: pathCounter, cc: circleCounter };
}

/**
 * Quote a property key if it contains characters that aren't valid
 * in unquoted JS identifiers (e.g. hyphens in data-icon-path).
 */
function quoteKey(key) {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}

/**
 * Convert SVG attribute names to JSX camelCase equivalents.
 */
function svgAttrToJsx(attr) {
  if (attr.startsWith('data-')) return attr;

  const map = {
    'fill-rule': 'fillRule',
    'clip-rule': 'clipRule',
    'clip-path': 'clipPath',
    'fill-opacity': 'fillOpacity',
    'stroke-width': 'strokeWidth',
    'stroke-linecap': 'strokeLinecap',
    'stroke-linejoin': 'strokeLinejoin',
    'stroke-miterlimit': 'strokeMiterlimit',
    'stroke-dasharray': 'strokeDasharray',
    'stroke-dashoffset': 'strokeDashoffset',
    'stroke-opacity': 'strokeOpacity',
    'font-family': 'fontFamily',
    'font-size': 'fontSize',
    'font-weight': 'fontWeight',
    'text-anchor': 'textAnchor',
    'text-decoration': 'textDecoration',
    'dominant-baseline': 'dominantBaseline',
    'alignment-baseline': 'alignmentBaseline',
    'baseline-shift': 'baselineShift',
    'stop-color': 'stopColor',
    'stop-opacity': 'stopOpacity',
    'flood-color': 'floodColor',
    'flood-opacity': 'floodOpacity',
    'lighting-color': 'lightingColor',
    'color-interpolation': 'colorInterpolation',
    'color-interpolation-filters': 'colorInterpolationFilters',
  };

  if (map[attr]) return map[attr];
  return attr.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Format a deprecation warning message.
 */
function formatDeprecationWarning(moduleName, reason) {
  if (!reason) {
    return (
      `The ${moduleName} component has been deprecated and will be ` +
      `removed in the next major version of @carbon/icons-react.`
    );
  }
  return (
    `${reason}. As a result, the ${moduleName} component will be removed in ` +
    `the next major version of @carbon/icons-react.`
  );
}

module.exports = builder;
