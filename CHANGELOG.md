# Changelog

## Version 0.7.0

- targeting Node `>= 20.19.0`;
- recursive subkeys (`::`, `:::`, etc.) are supported now;
- changed (fixed) sources precedence:
  - JSON files and presets are composed in the order they are provided (as before);
  - explicit command line arguments are applied last and can override values from files and presets (new behavior);
- some changes to escaping rules for keys containing `!` and `:`;
- adjusted `package.json` exports;
- `*.d.ts` files are bundled by `rollup` now.

## Version 0.6.0

- fix subkeys inside automatically indexed array item;
- change `inspect` handler options to expose `node:util.InspectOptions`;
- raise Node.js required version to `>= 14.13.1` (uses `node:` prefixes).

## Version 0.5.2

- few corrections for help command output.

## Version 0.5.1

- fix `unparse` - indexing was broken for arrays of objects;
- update Readme - extra notes about usage in PowerShell.

## Version 0.5.0

Initial release.

Aiming at Node.js version 14 and up.
