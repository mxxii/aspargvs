// This file is responsible for parsing individual argument strings
// into tokens for the second stage parser (keys-parser.ts).


import * as p from 'peberminta';
import * as pc from 'peberminta/char';


export type ObjectPath = { key0: string; keys: (string | number)[] };
export type ArrayPath  = { key0: number; keys: (string | number)[] };
export type Path = ObjectPath | ArrayPath;

export type ArgValue = null | true | false | number | string | Record<string, never> | ArgValue[];

export type KeyValuePair = { type: 'keyValue'; value: ArgValue };
export type BareKey      = { type: 'bareKey' };
export type Negation     = { type: 'negation' };
export type ArrayKey     = { type: 'arrayKey' };
export type ObjectKey    = { type: 'objectKey' };
export type KeyData = KeyValuePair | BareKey | Negation | ArrayKey | ObjectKey;

export type KeyTokenOfObject = { type: 'keyToken'; depth: number; path: ObjectPath; data: KeyData };
export type KeyTokenOfArray = { type: 'keyToken'; depth: number; path: ArrayPath; data: KeyData };
export type KeyToken = { type: 'keyToken'; depth: number; path: Path; data: KeyData };

export type BareValueToken = { type: 'bareValue'; value: ArgValue };
export type ArgToken = KeyToken | BareValueToken;

type Options = { arg: string };


export function isKeyTokenOfObject (token: ArgToken): token is KeyTokenOfObject {
  return token.type === 'keyToken' && typeof token.path.key0 === 'string';
}

export function isKeyTokenOfArray (token: ArgToken): token is KeyTokenOfArray {
  return token.type === 'keyToken' && typeof token.path.key0 === 'number';
}


function escapeDoubleQuotes (str: string) {
  return str.replace(/\\([\s\S])|(")/g, '\\$1$2');
}

function unescapeString (chars: string[]) {
  return JSON.parse('"' + escapeDoubleQuotes(chars.join('')) + '"') as string;
}


function escapedChar (
  mustEscapeChars: Set<string>,
  canEscapeChars: Set<string> = new Set(),
): p.Parser<string, Options, string> {
  mustEscapeChars.add('\\');
  for (const char of mustEscapeChars) {
    canEscapeChars.delete(char);
  }
  const mustEscapes = [...mustEscapeChars]
    .map(c => p.right(pc.char('\\'), pc.char(c)));
  const canEscapes = [...canEscapeChars]
    .map(c => p.right(pc.char('\\'), pc.char(c)));
  return p.choice(
    ...mustEscapes,
    ...canEscapes,
    pc.noneOf([...mustEscapeChars]),
  );
}

function stringOfChars (
  pChar: p.Parser<string, Options, string>,
) {
  return p.map(p.many(pChar), unescapeString);
}

function quotedString (
  quoteChar: string,
): p.Parser<string, Options, string> {
  return p.middle(
    pc.char(quoteChar),
    stringOfChars(escapedChar(new Set([quoteChar]))),
    pc.char(quoteChar),
  );
}

const btString_ = quotedString('`');
const sqString_ = quotedString("'");
const dqString_ = quotedString('"');

const pathKey_        = stringOfChars(escapedChar(new Set('.=[{'), new Set('!:')));
const arrayString_    = stringOfChars(escapedChar(new Set(',]')));
const unquotedString_ = stringOfChars(p.any);

const nullValue_   = p.map(pc.str('null'),  () => null);
const trueValue_   = p.map(pc.str('true'),  () => true);
const falseValue_  = p.map(pc.str('false'), () => false);
const emptyObject_ = p.map(pc.str('{}'),    () => ({}));

const digits_ = p.many1(pc.oneOf('0123456789'));

const jsonFloat_ = p.map(
  pc.concat(
    p.option(pc.char('-'), ''),
    digits_,
    p.option(pc.concat(pc.char('.'), digits_), ''),
    p.option(pc.concat(pc.oneOf('eE'), p.option(pc.oneOf('+-'), ''), digits_), ''),
  ),
  parseFloat,
);

const unsignedInt_ = p.map(
  digits_,
  chars => parseInt(chars.join('')),
);

const primitiveValue_: p.Parser<string, Options, ArgValue> = p.choice(
  emptyObject_,
  nullValue_,
  trueValue_,
  falseValue_,
  jsonFloat_,
);

const array_ = p.choice<string, Options, ArgValue[]>(
  p.ab(
    pc.char('['), pc.char(']'),
    () => [],
  ),
  p.middle(
    pc.char('['),
    p.sepBy1(p.recursive(() => arrayValue_), pc.char(',')),
    pc.char(']'),
  ),
);

const arrayValue_: p.Parser<string, Options, ArgValue> = p.choice(
  primitiveValue_,
  array_,
  sqString_,
  dqString_,
  btString_,
  arrayString_,
);

const bareValue_ = p.eitherOr(
  p.choice(
    primitiveValue_,
    array_,
    sqString_,
    dqString_,
    btString_,
  ),
  unquotedString_,
);

const pathIndex_ = p.middle(
  pc.char('['),
  p.eitherOr(
    unsignedInt_,
    p.map(pc.char('_'), () => Number.NaN),
  ),
  pc.char(']'),
);

const pathItem_: p.Parser<string, Options, string | number> = p.eitherOr(
  p.right(p.option(pc.char('.'), ''), pathIndex_),
  p.right(pc.char('.'),               pathKey_),
);

const objectPath_: p.Parser<string, Options, ObjectPath> = p.ab(
  pathKey_, p.many(pathItem_),
  (head, tail) => ({ key0: head, keys: tail }),
);

const arrayPath_: p.Parser<string, Options, ArrayPath> = p.ab(
  pathIndex_, p.many(pathItem_),
  (head, tail) => ({ key0: head, keys: tail }),
);

const path_: p.Parser<string, Options, Path> = p.eitherOr(
  arrayPath_,
  objectPath_,
);

const bareValueToken_: p.Matcher<string, Options, BareValueToken> = p.map(
  bareValue_,
  v => ({ type: 'bareValue', value: v }),
);

const keyToken_: p.Parser<string, Options, KeyToken> = p.chain(
  p.eitherOr(
    p.map(p.discard(pc.char('-'), pc.char('-')), () => 0),
    p.map(p.many1(pc.char(':')), colons => colons.length),
  ),
  (depth) => {
    const pPath = (depth > 0) ? path_ : objectPath_;
    return p.choice<string, Options, KeyToken>(
      p.abc(
        pc.char('!'),
        pPath,
        p.eitherOr(
          p.end,
          p.error(data => `Failed to parse the argument "${data.options.arg}".`),
        ),
        (_, path) => ({
          type: 'keyToken',
          depth: depth,
          path: path,
          data: { type: 'negation' },
        }),
      ),
      p.ab(
        pPath,
        p.choice(
          p.map(p.end, () => 'bareKey' as const),
          p.map(p.discard(pc.char('['), pc.char(']'), p.end), () => 'arrayKey' as const),
          p.map(p.discard(pc.char('{'), pc.char('}'), p.end), () => 'objectKey' as const),
        ),
        (path, type) => ({
          type: 'keyToken',
          depth: depth,
          path: path,
          data: { type: type },
        }),
      ),
      p.abc(
        pPath,
        p.right(pc.char('='), bareValue_),
        p.end,
        (path, value) => ({
          type: 'keyToken',
          depth: depth,
          path: path,
          data: { type: 'keyValue', value: value },
        }),
      ),
      p.error(data => `Failed to parse the argument "${data.options.arg}".`),
    );
  },
);

const matchArgToken_: p.Matcher<string, Options, ArgToken> = p.otherwise(
  keyToken_,
  bareValueToken_,
);


export function argToToken (arg: string): ArgToken {
  return pc.match(matchArgToken_, arg, { arg: arg });
}
