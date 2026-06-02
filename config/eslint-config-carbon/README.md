# eslint-config-carbon

> Shared ESLint
> [flat config](https://eslint.org/docs/latest/use/configure/configuration-files)
> for Carbon Design System repositories.

## Getting started

```bash
npm install --save-dev eslint-config-carbon eslint
```

Requires ESLint v10+.

## Usage

`eslint-config-carbon` ships as a flat config. Spread one of its exported
configs into your `eslint.config.mjs`:

```js
import carbon from 'eslint-config-carbon';

export default [
  ...carbon,
  // your overrides
];
```

### Exports

- **`carbon`** (default): `recommended`: base + React. Common cases
- **`base`**: ESLint + typescript-eslint, no React rules. For non-React packages
- **`react`**: jsx-a11y, react-hooks, and `@eslint-react` rules only
- **`testing`**: `eslint-plugin-testing-library` rules for test files

```js
import { base, react, testing } from 'eslint-config-carbon';

export default [...base, ...react, ...testing];
```

> [!NOTE] The React config adopts a small subset of
> [`@eslint-react`](https://eslint-react.xyz)'s recommended rules. Additional
> rules are being enabled incrementally.

## 🙌 Contributing

We're always looking for contributors to help us fix bugs, build new features,
or help us improve the project documentation. If you're interested, definitely
check out our [Contributing Guide](/.github/CONTRIBUTING.md)! 👀

## 📝 License

Licensed under the [Apache 2.0 License](/LICENSE).
