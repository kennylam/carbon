# `@carbon/web-components`

> Web components for the Carbon Design System

## Getting started

To install `@carbon/web-components` in your project, you will need to run the
following command using [npm](https://www.npmjs.com/):

```bash
npm install -S @carbon/web-components
```

If you prefer [Yarn](https://yarnpkg.com/en/), use the following command
instead:

```bash
yarn add @carbon/web-components
```

### Usage

The `@carbon/web-components` package provides components for the Carbon Design
System.

To use a component, you can import it directly from the package:

```javascript
import '@carbon/web-components/es/components/dropdown/dropdown.js';
import '@carbon/web-components/es/components/dropdown/dropdown-item.js';
```

Once you've imported the component modules, you can use the components in the
same manner as native HTML tags:

```html
<cds-dropdown trigger-content="Select an item">
  <cds-dropdown-item value="all">Option 1</cds-dropdown-item>
  <cds-dropdown-item value="cloudFoundry">Option 2</cds-dropdown-item>
  <cds-dropdown-item value="staging">Option 3</cds-dropdown-item>
  <cds-dropdown-item value="dea">Option 4</cds-dropdown-item>
  <cds-dropdown-item value="router">Option 5</cds-dropdown-item>
</cds-dropdown>
```

#### Scoped elements and the registry polyfill

Scoped elements make it possible for different versions of the same component to
coexist as internal dependencies, as long as those components are instantiated
within shadow DOM and are not registered under the same global custom element
tag names (host element).

To avoid custom element tag name collisions with other libraries, this package
uses scoped elements.

Scoped elements require the Scoped Custom Element Registry polyfill, which must
be loaded before any custom elements are defined.

To enable scoped elements, import the shared entrypoint first:

```javascript
import '@carbon/web-components/scoped-elements';
import '@carbon/web-components/es/components/dropdown/dropdown.js';
import '@carbon/web-components/es/components/dropdown/dropdown-item.js';
```

This entrypoint loads the polyfill and then re-exports the standard index. It
still needs to be your very first custom elements import in the app.

##### Supported usage

`@carbon/web-components` is designed to be used as a single, canonical set of
custom elements in a page or application. It is compatible with other UI
libraries as long as they do not register the same custom-element tag names.

##### Not supported

Scoped elements only prevent collisions inside the shadow DOM. The host element
name must still be unique in the global registry. Running
`@carbon/web-components` alongside another library that registers the same
`cds-\*` custom elements in the same page or runtime is not supported. Custom
element tag names are global per page; if two libraries attempt to define the
same tag name (for example, a global tag name `cds-modal`), the browser will
throw a registration error and behavior is undefined.

#### CDN

CDN artifacts are also available and can be added directly to the page (starting
at version `v1.16.0`):

```html
<!doctype html>
<html>
  <head>
    <script
      type="module"
      src="https://1.www.s81c.com/common/carbon/web-components/version/v2.24.0/dropdown.min.js"></script>
    <style type="text/css">
      <!-- hide custom element until it has been defined //-->
      cds-dropdown:not(:defined),
      cds-dropdown-item:not(:defined) {
        visibility: hidden;
      }
    </style>
  </head>
  <body>
    <div id="app">
      <cds-dropdown trigger-content="Select an item">
        <cds-dropdown-item value="all">Option 1</cds-dropdown-item>
        <cds-dropdown-item value="cloudFoundry">Option 2</cds-dropdown-item>
        <cds-dropdown-item value="staging">Option 3</cds-dropdown-item>
        <cds-dropdown-item value="dea">Option 4</cds-dropdown-item>
        <cds-dropdown-item value="router">Option 5</cds-dropdown-item>
      </cds-dropdown>
    </div>
  </body>
</html>
```

### Other usage guides

- [Using components in a form](./docs/form.md)
- [Using custom styles in components](./docs/styling.md)

## 📖 API Documentation

If you're looking for `@carbon/web-components` API documentation, check out:

- [Storybook](https://web-components.carbondesignsystem.com/)

## 🙌 Contributing

We're always looking for contributors to help us fix bugs, build new features,
or help us improve the project documentation. If you're interested, definitely
check out our [Contributing Guide](/.github/CONTRIBUTING.md)! 👀

## 📝 License

Licensed under the [Apache 2.0 License](/LICENSE).

## <picture><source height="20" width="20" media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/ibm-telemetry/telemetry-js/main/docs/images/ibm-telemetry-dark.svg"><source height="20" width="20" media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/ibm-telemetry/telemetry-js/main/docs/images/ibm-telemetry-light.svg"><img height="20" width="20" alt="IBM Telemetry" src="https://raw.githubusercontent.com/ibm-telemetry/telemetry-js/main/docs/images/ibm-telemetry-light.svg"></picture> IBM Telemetry

This package uses IBM Telemetry to collect de-identified and anonymized metrics
data. By installing this package as a dependency you are agreeing to telemetry
collection. To opt out, see
[Opting out of IBM Telemetry data collection](https://github.com/ibm-telemetry/telemetry-js/tree/main#opting-out-of-ibm-telemetry-data-collection).
For more information on the data being collected, please see the
[IBM Telemetry documentation](https://github.com/ibm-telemetry/telemetry-js/tree/main#ibm-telemetry-collection-basics).
