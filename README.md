# .

An Electron application with React and TypeScript

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Versioning

Before publishing a new installer, bump the app version first:

```bash
# bugfix release, e.g. 1.0.0 -> 1.0.1
$ npm run version:patch

# feature release, e.g. 1.0.0 -> 1.1.0
$ npm run version:minor

# breaking release, e.g. 1.0.0 -> 2.0.0
$ npm run version:major
```

The installer version comes from `package.json`. Keep `appId: com.pamodoro.app` unchanged in `electron-builder.yml`; with the same `appId`, a newer Windows installer can be installed over the previous version instead of being treated as a different app.

For the most common Windows release flow, use one command:

```bash
# runs typecheck first, then 1.0.0 -> 1.0.1, then builds the Windows installer
$ npm run release:win
```

If you need a non-patch release, use the explicit variants instead:

```bash
$ npm run release:win:minor
$ npm run release:win:major
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
