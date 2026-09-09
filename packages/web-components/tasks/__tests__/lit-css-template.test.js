/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { escapeForTemplate, verifyRoundTrip } from '../lit-css-template.js';

/**
 * Evaluates escaped CSS as a template literal, the same way a generated style
 * module is evaluated at runtime
 *
 * Uses real JS rather than re-implementing escape processing,
 * so this is isolated from `escapeForTemplate`
 *
 * @param {string} escaped escaped CSS
 * @returns {string} resulting CSS
 */
function evaluateTemplate(escaped) {
  return new Function(`return \`${escaped}\`;`)();
}

describe('escapeForTemplate', () => {
  const cases = {
    // these all occur in actual compiled output
    'escaped class selector': '.cds--grid\\:col-span-4{display:block}',
    'em-dash content escape': '.a::after{content:"\\2014"}',
    'icon font escape': '.b::before{content:"\\e900"}',
    'trailing backslash': '.c{content:"x\\\\"}',
    backtick: '.d{font-family:"a`b"}',
    'template placeholder': '.e{content:"${notAnExpression}"}',
    'lone dollar': '.f{content:"$"}',
    'plain css': ':host{display:block}',
    empty: '',
  };

  for (const [label, css] of Object.entries(cases)) {
    it(`round-trips ${label}`, () => {
      assert.equal(evaluateTemplate(escapeForTemplate(css)), css);
    });
  }

  it('round-trips every printable ascii character', () => {
    let css = '';
    for (let code = 0x20; code <= 0x7e; code++) {
      css += String.fromCharCode(code);
    }
    assert.equal(evaluateTemplate(escapeForTemplate(css)), css);
  });

  it('prevents a backslash being silently dropped', () => {
    // `\:` is a NonEscapeCharacter: the backslash disappears and
    // `.cds--grid\:col-span-4` would silently become a pseudo-class selector
    assert.equal(evaluateTemplate('\\:'), ':');
    assert.equal(evaluateTemplate(escapeForTemplate('\\:')), '\\:');
  });

  it('prevents an octal-looking escape breaking the literal', () => {
    // `\2014` is a legacy escape, which is a SyntaxError in a template
    // literal (and becomes `undefined` in a tagged one)
    assert.throws(() => evaluateTemplate('\\2014'), /[Oo]ctal/);
    assert.equal(evaluateTemplate(escapeForTemplate('\\2014')), '\\2014');
  });
});

describe('verifyRoundTrip', () => {
  it('accepts correctly escaped css', () => {
    const css = '.cds--x\\:y{color:red}';
    assert.doesNotThrow(() =>
      verifyRoundTrip(escapeForTemplate(css), css, 'x.scss')
    );
  });

  it('rejects unescaped css instead of emitting it', () => {
    const css = '.cds--x\\:y{color:red}';
    assert.throws(
      () => verifyRoundTrip(css, css, 'x.scss'),
      /does not round-trip|not a valid template literal/
    );
  });

  it('names the offending file so the failure is actionable', () => {
    assert.throws(
      () => verifyRoundTrip('`', 'x', 'components/button/button.scss'),
      /components\/button\/button\.scss/
    );
  });
});
