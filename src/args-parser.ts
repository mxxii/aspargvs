
import * as p from 'peberminta';
import { inspect } from 'node:util';

import { parseAllCommands } from './commands-parser';
import { getHelp } from './help';
import { JsonObject, setJsonObjectItem, setJsonArrayItem } from './json';
import { argToToken } from './key-token-parser';
import { parseAllKeys } from './keys-parser';
import { Options } from './options';
import { unparseArgs } from './unparse';

/**
 * Parse arguments into JSON object,
 * run required actions as defined in options object.
 *
 * This function uses `process.argv` by itself.
 *
 * @param options - {@link Options} object.
 */
export function handleArgv (options: Options = {}): void {
  return handleArgs(process.argv.slice(2), options);
}

/**
 * Parse arguments into JSON object,
 * run required actions as defined in options object.
 *
 * This function expects a stripped arguments array.
 *
 * Use {@link handleArgv} instead in case you don't do anything with it.
 *
 * @param args - arguments array (for example `process.argv.slice(2)`).
 * @param options - {@link Options} object.
 */
export function handleArgs (args: string[], options: Options = {}): void {
  const commandResult =
    parseAllCommands({ tokens: args, options: options }, 0);

  if (commandResult.value.command === 'version') {
    const version = options.handlers?.version?.();
    if (version) { console.log(version); }
    return;
  }

  if (commandResult.value.command === 'help') {
    const handler = options.handlers?.help;
    if (handler) {
      const baseHelpText = getHelp(options);
      const help = (typeof handler === 'function')
        ? handler(baseHelpText)
        : baseHelpText;
      if (help) { console.log(help); }
    }
    return;
  }

  let json = parseJsonFromKeys(args.slice(commandResult.position), options);

  if (commandResult.value.type === 'commandWithData' && options.handlers?.merge) {
    // In fact, options.handlers.merge is definitely set here,
    // otherwise it would've errored in parseAllCommands call above.
    json = options.handlers.merge(json, commandResult.value.json);
  }

  if (commandResult.value.command === 'inspect' && options.handlers?.inspect) {
    const logString = (typeof options.handlers.inspect === 'function')
      ? options.handlers.inspect(json)
      : inspect(json, options.handlers.inspect);
    if (logString) { console.log(logString); }
    return;
  }

  if (commandResult.value.command === 'unparse' && options.handlers?.unparse) {
    const argStrings = unparseArgs(json, options?.handlers?.unkey);
    const handler = options.handlers.unparse;
    const logString = (typeof handler === 'function')
      ? handler(argStrings)
      : argStrings.join(' ');
    if (logString) { console.log(logString); }
    return;
  }

  if (options.handlers?.json) {
    const logString = options.handlers.json(json);
    if (logString) { console.log(logString); }
  } else {
    throw new Error(
      `What to do with parsed args JSON object? 'json' handler is not specified.`
    );
  }
}

function parseJsonFromKeys(
  args: string[],
  options: Options
) {
  const tokens = args.map(argToToken);
  const tokensData = { tokens: tokens, options: options };
  const allKeysResult = parseAllKeys(tokensData, 0);
  if (p.remainingTokensNumber(tokensData, allKeysResult.position) > 0) {
    const remainingArgs = args
      .slice(allKeysResult.position)
      .join(' ');
    throw new Error(`Some args can not be parsed: ${remainingArgs}`);
  }
  const json = allKeysResult.value.reduce(
    (acc, kv) => {
      if (kv.type === 'objectKeyValue') {
        for (const subKey of kv.subs) {
          setJsonObjectItem(
            kv.value,
            subKey.value,
            options.handlers?.key,
            subKey.path.key0,
            ...subKey.path.keys
          );
        }
      } else if (kv.type === 'arrayKeyValue') {
        for (const subKey of kv.subs) {
          setJsonArrayItem(
            kv.value,
            subKey.value,
            options.handlers?.key,
            subKey.path.key0,
            ...subKey.path.keys
          );
        }
      }
      setJsonObjectItem(
        acc,
        kv.value,
        options.handlers?.key,
        kv.path.key0,
        ...kv.path.keys
      );
      return acc;
    },
    {} as JsonObject
  );
  return json;
}
