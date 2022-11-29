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
  const lines: ([string, boolean?])[] = [
    ['Command line arguments:'],
    [`  ${binName}[commands...] [keys and values...]`],
    [''],
    ['Commands are:'],
    ['  version, -v                : Print version number and exit', !!options.handlers?.version],
    ['  help,    -h                : Print this message and exit', !!options.handlers?.help],
    ['  inspect, -i                : Pretty print the args object and exit', !!options.handlers?.inspect],
    ['  unparse, -u                : Print the args object back as args string and exit', !!options.handlers?.unparse],
    ['  json,    -j <file_name>    : Merge given JSON file contents into args object', !!options.handlers?.merge],
    ['  preset,  -p <preset_name>  : Merge given preset into args object', !!options.handlers?.merge && presets.length > 0],
    ...((presets.length > 0) ? [
      [''],
      ['Presets are:'],
      ...presets
    ] : []) as ([string, boolean?])[],
    [''],
    ['Key syntax:'],
    ['  --foo                     : True value'],
    ['  --!foo                    : False value'],
    ['  --foo=<value>             : Value (see below)'],
    ['  --foo=[<value>,...]       : Array'],
    ['  --foo[] <value> <value>   : Array'],
    ['  --foo[i]=<value>          : i-th item in array'],
    ['  --foo[_]=<value>          : Next item in array (automatic index)'],
    ['  --foo.bar.[0]=<value>     : Nesting with dot chain'],
    ['  --foo{} :bar=<value> :baz : Empty object and it\'s subkeys'],
    ['  --foo[] :[0].bar :[1].bar : Subkeys for objects inside a common array'],
    [''],
    ['Value syntax:'],
    ['  null           : Null value'],
    ['  true           : True value'],
    ['  false          : False value'],
    ['  1.23e+4        : Number'],
    ['  [<value>,...]  : Array'],
    ['  {}             : Empty object (Use separate args for non-empty objects)'],
    ['  "null"         : String (Beware - Node.js strips unescaped double quotes)'],
    ["  'true'         : String (Beware - some shells may strip unescaped quotes)"],
    ['  `false`        : String (Beware - some shells may strip unescaped quotes)'],
    ['  anything else  : String (Don\'t need quotes unless it is ambiguous)'],
    [''],
    ['Escape syntax characters inside keys and arrays with "\\".'],
  ];
  return lines
    .filter(([,b]) => b !== false)
    .map(([s,]) => s)
    .join('\n');
}
