import { Options } from './options';

export function getHelp (options: Options): string {
  const binName = (s => s ? s + ' ' : '')(options.handlers?.bin?.());
  let presets: ([string, boolean])[] = [];
  if (options.presets && Object.keys(options.presets).length > 0) {
    const maxKeyLength = Math.max(
      ...Object.keys(options.presets).map((key) => key.length)
    );
    presets = Object.entries(options.presets).map(
      ([key,{description}]) =>
        [`  ${key.padEnd(maxKeyLength)}  : ${description}`, true]
    );
  }
  const lines: ([string, boolean])[] = [
    ['Command line arguments:', true],
    [`  ${binName}[commands...] [keys and values...]`, true],
    ['', true],
    ['Commands are:', true],
    ['  version, -v                : Print version number', !!options.handlers?.version],
    ['  help,    -h                : Print this message', !!options.handlers?.help],
    ['  inspect, -i                : Pretty print the args object', !!options.handlers?.inspect],
    ['  unparse, -u                : Print the args object back as args string', !!options.handlers?.unparse],
    ['  json,    -j <file_name>    : Merge given file contents with args object', !!options.handlers?.merge],
    ['  preset,  -p <preset_name>  : Merge given preset into args object', !!options.handlers?.merge && presets.length > 0],
    ...((presets.length > 0) ? [
      ['', true],
      ['Presets are:', true],
      ...presets
    ] : []) as ([string, boolean])[],
    ['', true],
    ['Key syntax:', true],
    ['  --foo                     : True value', true],
    ['  --!foo                    : False value', true],
    ['  --foo=<value>             : Value', true],
    ['  --foo=[<value>,...]       : Array', true],
    ['  --foo[] <value> <value>   : Array', true],
    ['  --foo[i]=<value>          : i-th item in array', true],
    ['  --foo.bar.baz=<value>     : Nesting objects with dot chain', true],
    ['  --foo{} :bar=<value> :baz : Empty object and it\'s subkeys', true],
    ['', true],
    ['Value syntax:', true],
    ['  null           : Null value', true],
    ['  true           : True value', true],
    ['  false          : False value', true],
    ['  1.23e+4        : Number', true],
    ['  [<value>,...]  : Array', true],
    ['  {}             : Empty object (Use separate args for complex objects)', true],
    ['  "null"         : String (Beware - Node.js strips unescaped double quotes)', true],
    ["  'true'         : String (Beware - some shells may strip unescaped quotes)", true],
    ['  `false`        : String (Beware - some shells may strip unescaped quotes)', true],
    ['  anything else  : String (Don\'t need quotes unless it is ambiguous)', true],
    ['', true],
    ['Escape syntax characters inside keys and values with "\\".', true],
  ];
  return lines
    .filter(([,b]) => b)
    .map(([s,]) => s)
    .join('\n');
}
