
import { JsonArray, JsonObject, JsonValue } from './json';

type Path = (string | number)[];
type UnparseArg = { type: 'one', path: Path, value: string };
type UnparseArgs = { type: 'many', args: UnparseArg[] };

function stringifyKey (key: string, unkey?: (key: string) => string): string {
  if (unkey) {
    key = unkey(key);
  }
  return key
    .replace(/\./g, '\\.')
    .replace(/\\=/g, '\\=');
}

function stringifyPath (path: Path, unkey?: (key: string) => string): string {
  return path.map(
    (fr) => (typeof fr === 'number')
      ? `[${fr}]`
      : `.${stringifyKey(fr, unkey)}`
  ).join('').replace(/^\./, '');
}

function stringifyArg (unkey?: (key: string) => string): (arg: UnparseArg) => string {
  return arg => {
    const path = stringifyPath(arg.path, unkey);
    if (arg.value === 'true') {
      return `--${path}`;
    }
    if (arg.value === 'false') {
      return `--!${path}`;
    }
    return `--${path}=${arg.value}`;
  };
}

function newArg (value: string): UnparseArg {
  return {
    type: 'one',
    path: [],
    value: value
  };
}

function nest (u: UnparseArg, key: string | number): UnparseArg {
  return {
    type: 'one',
    path: [key, ...u.path],
    value: u.value
  };
}

function unparseArray (json: JsonArray): UnparseArg | UnparseArgs {
  const unparsed = json.map(unparse);
  const values: string[] = [];
  const args: UnparseArg[] = [];
  function flushValues () {
    if (!values.length) { return; }
    args.push(newArg(`[${values.join(',')}]`));
    values.length = 0;
  }
  for (let i = 0; i < unparsed.length; i++) {
    const u = unparsed[i];
    if (u.type === 'one' && u.path.length === 0) {
      values.push(u.value);
    } else {
      flushValues();
      if (u.type === 'one') {
        args.push(nest(u, i));
      } else {
        args.push(...u.args.map(nest));
      }
    }
  }
  flushValues();
  return (args.length === 0) ? newArg('[]')
    : (args.length === 1) ? args[0]
      : { type: 'many', args: args };
}

function unparseObject (json: JsonObject): UnparseArg | UnparseArgs {
  const args: UnparseArg[] = [];
  for (const key of Object.keys(json)) {
    const u = unparse(json[key]);
    if (u.type === 'one') {
      args.push(nest(u, key));
    } else {
      args.push(...u.args.map((a) => nest(a, key)));
    }
  }
  return (args.length === 0) ? newArg('{}')
    : (args.length === 1) ? args[0]
      : { type: 'many', args: args };
}

function unparseString (str: string): UnparseArg {
  return newArg((/[\s={}[,\]"'`]|^[-.\d]|^(?:true|false|null)$/i.test(str))
    ? JSON.stringify(str)
    : str
  );
}

function unparse (json: JsonValue): UnparseArg | UnparseArgs {
  switch (typeof json) {
    case 'boolean':
    case 'number':
      return newArg(JSON.stringify(json));
    case 'string':
      return unparseString(json);
    case 'object':
      if (json === null) {
        return newArg(JSON.stringify(json));
      } else if (Array.isArray(json)) {
        return unparseArray(json);
      } else {
        return unparseObject(json);
      }
  }
}

/**
 * Convert a JSON object into an equivalent array of arguments.
 *
 * @param json - JSON object to break down into arguments.
 * @param unkey - A function to transform keys
 * (for example change camel case of JSON keys to kebab case of CLI arguments).
 * @returns An array of argument strings (unescaped, may require escaping specific to a shell).
 */
export function unparseArgs (json: JsonObject, unkey?: (key: string) => string): string[] {
  let unparsed = unparseObject(json);
  if (unparsed.type === 'one') {
    if (unparsed.path.length === 0) { // empty root object
      return [];
    }
    unparsed = { type: 'many', args: [unparsed] };
  }
  return unparsed.args.map(stringifyArg(unkey));
}
