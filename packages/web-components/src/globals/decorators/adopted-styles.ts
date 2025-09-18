/**
 * Copyright IBM Corp. 2024
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * A decorator that automatically initializes adopted stylesheets for a component.
 * This allows components to automatically adopt shared stylesheets from
 * `<link data-carbon-shared="true">` tags in the document.
 *
 * Usage:
 * ```typescript
 * @adoptedStyles()
 * @customElement('my-component')
 * class MyComponent extends LitElement {
 *   // Component implementation
 * }
 * ```
 */
export function adoptedStyles() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- https://github.com/carbon-design-system/carbon/issues/20071
  return function <T extends { new (...args: any[]): any }>(constructor: T) {
    return class extends constructor {
      connectedCallback() {
        super.connectedCallback();
        if (this.shadowRoot) {
          // look for shared stylesheets in the document.
          // TODO: see if this can be internalized so external link isn't needed
          const sharedLinks = document.querySelectorAll(
            'link[data-carbon-shared="true"]'
          );

          const sharedStyles: CSSStyleSheet[] = [];

          for (const link of sharedLinks) {
            const href = (link as HTMLLinkElement).href;

            // check if the link has a stylesheet property
            if ((link as HTMLLinkElement).sheet) {
              try {
                // create a new CSSStyleSheet and copy rules
                const newSheet = new CSSStyleSheet();
                const rules = Array.from(
                  (link as HTMLLinkElement).sheet?.cssRules || []
                );

                // add all rules at once
                const cssText = rules.map((rule) => rule.cssText).join('\n');
                newSheet.replaceSync(cssText);

                sharedStyles.push(newSheet);
              } catch (error) {
                // eslint-disable-next-line no-console
                console.warn(
                  `Failed to get stylesheet from link: ${href}`,
                  error
                );
              }
            }
          }

          // combine shared styles with component styles
          if (sharedStyles.length > 0) {
            const existingStyles =
              (this.constructor as { styles?: unknown }).styles || [];
            this.shadowRoot.adoptedStyleSheets = [
              ...sharedStyles,
              ...(Array.isArray(existingStyles)
                ? (existingStyles as CSSStyleSheet[])
                : [existingStyles as CSSStyleSheet]),
            ];
          }
        }
      }
    };
  };
}
