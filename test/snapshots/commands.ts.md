# Snapshot report for `test/commands.ts`

The actual snapshot is saved in `commands.ts.snap`.

Generated by [AVA](https://avajs.dev).

## version command

> `version`

    [
      `v1␊
      `,
    ]

## version command with own output

> `version`

    [
      `v1␊
      `,
    ]

## version command - short alias

> `-v`

    [
      `v1␊
      `,
    ]

## version command - common alias

> `--version`

    [
      `v1␊
      `,
    ]

## version alias without handler

> `--version`

    [
      `{"version":true}␊
      `,
    ]

## help command

> `help`

    [
      `help placeholder␊
      `,
    ]

## help command - short alias

> `-h`

    [
      `help placeholder␊
      `,
    ]

## help command - common alias

> `--help`

    [
      `help placeholder␊
      `,
    ]

## help alias without handler

> `--help`

    [
      `{"help":true}␊
      `,
    ]

## help command - with own output

> `help`

    [
      `help placeholder␊
      `,
    ]

## help command - default handler, no merge handler

> `help`

    [
      `Command line arguments:␊
        [commands...] [keys and values...]␊
      ␊
      Commands are:␊
        help,    -h                : Print this message and exit␊
      ␊
      Key syntax:␊
        --foo                     : True value␊
        --!foo                    : False value␊
        --foo=<value>             : Value (see below)␊
        --foo=[<value>,...]       : Array␊
        --foo[] <value> <value>   : Array␊
        --foo[i]=<value>          : i-th item in array␊
        --foo[_]=<value>          : Next item in array (automatic index)␊
        --foo.bar.[0]=<value>     : Nesting with dot chain␊
        --foo{} :bar=<value> :baz : Empty object and it's subkeys␊
        --foo[] :[0].bar :[1].bar : Subkeys for objects inside a common array␊
      ␊
      Value syntax:␊
        null           : Null value␊
        true           : True value␊
        false          : False value␊
        1.23e+4        : Number␊
        [<value>,...]  : Array␊
        {}             : Empty object (Use separate args for non-empty objects)␊
        "null"         : String (Beware - Node.js strips unescaped double quotes)␊
        'true'         : String (Beware - some shells may strip unescaped quotes)␊
        \`false\`        : String (Beware - some shells may strip unescaped quotes)␊
        anything else  : String (Don't need quotes unless it is ambiguous)␊
      ␊
      Escape syntax characters inside keys and arrays with "\\".␊
      `,
    ]

## help command - pass-through handler, bin, version, inspect, unparse, presets

> `help`

    [
      `Command line arguments:␊
        example [commands...] [keys and values...]␊
      ␊
      Commands are:␊
        version, -v                : Print version number and exit␊
        help,    -h                : Print this message and exit␊
        inspect, -i                : Pretty print the args object and exit␊
        unparse, -u                : Print the args object back as args string and exit␊
        json,    -j <file_name>    : Merge given JSON file contents into args object␊
        preset,  -p <preset_name>  : Merge given preset into args object␊
      ␊
      Presets are:␊
        foo  : Foo␊
        bar  : Bar␊
        baz  : Baz␊
      ␊
      Key syntax:␊
        --foo                     : True value␊
        --!foo                    : False value␊
        --foo=<value>             : Value (see below)␊
        --foo=[<value>,...]       : Array␊
        --foo[] <value> <value>   : Array␊
        --foo[i]=<value>          : i-th item in array␊
        --foo[_]=<value>          : Next item in array (automatic index)␊
        --foo.bar.[0]=<value>     : Nesting with dot chain␊
        --foo{} :bar=<value> :baz : Empty object and it's subkeys␊
        --foo[] :[0].bar :[1].bar : Subkeys for objects inside a common array␊
      ␊
      Value syntax:␊
        null           : Null value␊
        true           : True value␊
        false          : False value␊
        1.23e+4        : Number␊
        [<value>,...]  : Array␊
        {}             : Empty object (Use separate args for non-empty objects)␊
        "null"         : String (Beware - Node.js strips unescaped double quotes)␊
        'true'         : String (Beware - some shells may strip unescaped quotes)␊
        \`false\`        : String (Beware - some shells may strip unescaped quotes)␊
        anything else  : String (Don't need quotes unless it is ambiguous)␊
      ␊
      Escape syntax characters inside keys and arrays with "\\".␊
      `,
    ]

## preset command

> `preset foo`

    [
      `{"a":true}␊
      `,
    ]

## preset command - short alias

> `-p foo`

    [
      `{"a":true}␊
      `,
    ]

## preset command - multiple presets

> `preset foo -p bar preset baz --b=3 --d`

    [
      `{"b":2,"d":true,"a":true,"c":[1,2]}␊
      `,
    ]

## json command

> `json ./test/files/sample1.json`

    [
      `{"a":true,"b":1,"c":[1]}␊
      `,
    ]

## json command - short alias

> `-j ./test/files/sample1.json`

    [
      `{"a":true,"b":1,"c":[1]}␊
      `,
    ]

## json command - multiple files

> `-j ./test/files/sample1.json -j ./test/files/sample2.json --b=3 --e`

    [
      `{"b":2,"e":true,"a":true,"c":[1,2],"d":"va"}␊
      `,
    ]

## json and preset - test 1

> `-j ./test/files/sample1.json -p baz`

    [
      `{"a":true,"b":2,"c":[1,2]}␊
      `,
    ]

## json and preset - test 2

> `-p baz -j ./test/files/sample1.json`

    [
      `{"b":1,"c":[2,1],"a":true}␊
      `,
    ]

## inspect command - default implementation

> `inspect --foo=bar`

    [
      `{ foo: 'bar' }␊
      `,
    ]

## inspect command - short alias

> `-i --foo=bar`

    [
      `{ foo: 'bar' }␊
      `,
    ]

## inspect command - deeply nested object - no depth specified

> `inspect --a.b.c.d.e.f.g.h`

    [
      `{ a: { b: { c: [Object] } } }␊
      `,
    ]

## inspect command - deeply nested object - depth = 5

> `inspect --a.b.c.d.e.f.g.h`

    [
      `{␊
        a: {␊
          b: {␊
            c: { d: { e: { f: [Object] } } }␊
          }␊
        }␊
      }␊
      `,
    ]

## inspect command - own handler

> `inspect --foo=bar`

    [
      `{"foo":"bar"}␊
      `,
    ]

## inspect command - own handler, own output

> `inspect --foo=bar`

    [
      `{"foo":"bar"}␊
      `,
    ]

## unparse command - default implementation

> `unparse --foo=bar --baz`

    [
      `--foo=bar --baz␊
      `,
    ]

## unparse command - short alias

> `-u --foo=bar --baz`

    [
      `--foo=bar --baz␊
      `,
    ]

## unparse command - own handler

> `unparse --foo=bar --baz`

    [
      `--foo=bar;;--baz␊
      `,
    ]

## unparse command - own handler, own output

> `unparse --foo=bar --baz`

    [
      `--foo=bar;;--baz␊
      `,
    ]

## command-like arguments after first key argument

> `--foo[] json help inspect unparse -j -h -i -u`

    [
      `Business logic start.␊
      `,
      `{"foo":["json","help","inspect","unparse","-j","-h","-i","-u"]}␊
      `,
      `Business logic end.␊
      `,
    ]
