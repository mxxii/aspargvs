
import { inspect } from 'node:util';
import * as p from 'peberminta';

import { parseAllCommands } from './commands-parser.ts';
import { getHelp } from './help.ts';
import { setJsonArrayItem, setJsonObjectItem, type JsonObject, type JsonValue } from './json.ts';
import { argToToken } from './key-token-parser.ts';
import { isArrayData, isObjectData, parseAllKeys, type ResultData } from './keys-parser.ts';
import { type Options } from './options.ts';
import { unparseArgs } from './unparse.ts';

/**
 * Parse `process.argv` into JSON object,
 * run required actions as defined in options object.
 *
 * This function automatically slices `process.argv` to remove paths to node executable and script file. Only actual arguments are parsed.
 *
 * Use {@link handleArgs} instead in case you need to pass custom arguments array.
 *
 * @param options - {@link Options} object.
 */
export function handleArgv (options: Options = {}): void {
  return handleArgs(process.argv.slice(2), options);
}

/**
 * Parse arguments-only array into JSON object,
 * run required actions as defined in options object.
 *
 * Use {@link handleArgv} instead in case you don't need any special pre-processing of `process.argv`.
 *
 * @param args - arguments array (for example `process.argv.slice(2)`).
 * @param options - {@link Options} object.
 */
export function handleArgs (args: string[], options: Options = {}): void {
  const commandResult = parseAllCommands({ tokens: args, options: options }, 0);

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
      `What to do with parsed args JSON object? 'json' handler is not specified.`,
    );
  }
}


function parseJsonFromKeys (args: string[], options: Options) {
  const tokens = args.map(argToToken);
  const tokensData = { tokens: tokens, options: options };
  const allKeysResult = parseAllKeys(tokensData, 0);
  if (p.remainingTokensNumber(tokensData, allKeysResult.position) > 0) {
    const remainingArgs = args
      .slice(allKeysResult.position)
      .join(' ');
    throw new Error(`Some args can not be parsed: ${remainingArgs}`);
  }

  return allKeysResult.value.reduce<JsonObject>(
    (acc, kd) => {
      const processedValue = resultDataToJsonValue(kd.data, options);
      setJsonObjectItem(
        acc,
        processedValue,
        options.handlers?.key,
        kd.path.key0,
        ...kd.path.keys,
      );
      return acc;
    },
    {},
  );
}

function resultDataToJsonValue (rd: ResultData, options: Options): JsonValue {
  if (isObjectData(rd)) {
    const obj = rd.value;
    for (const s of rd.subs) {
      setJsonObjectItem(
        obj,
        resultDataToJsonValue(s.data, options),
        options.handlers?.key,
        s.path.key0,
        ...s.path.keys,
      );
    }
    return obj;
  } else if (isArrayData(rd)) {
    const arr = rd.value;
    for (const s of rd.subs) {
      setJsonArrayItem(
        arr,
        resultDataToJsonValue(s.data, options),
        options.handlers?.key,
        s.path.key0,
        ...s.path.keys,
      );
    }
    return arr;
  }
  return rd.value;
}
