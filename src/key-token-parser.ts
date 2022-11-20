
import * as p from 'peberminta';
import * as pc from 'peberminta/char';


export type ObjectPath = { key0: string, keys: (string | number)[] };
export type ArrayPath  = { key0: number, keys: (string | number)[] };
export type Path = ObjectPath | ArrayPath;
export type ArgValue = null | true | false | number | string | Record<string, never> | ArgValue[];

export type KeyValuePair = { type: 'keyValue', value: ArgValue };
export type BareKey      = { type: 'bareKey' };
export type Negation     = { type: 'negation' };
export type ArrayKey     = { type: 'arrayKey' };
export type ObjectKey    = { type: 'objectKey' };
export type KeyData = KeyValuePair | BareKey | Negation | ArrayKey | ObjectKey;

export type ArraySubKey  = { type: 'subKey', data: KeyData, path: ArrayPath }
export type ObjectSubKey = { type: 'subKey', data: KeyData, path: ObjectPath }
export type SubKey = ObjectSubKey | ArraySubKey;

export type FullKey = { type: 'fullKey', data: KeyData, path: ObjectPath }
export type KeyedArgToken = FullKey | SubKey;

export type BareValue = { type: 'bareValue', value: ArgValue };
export type ArgToken = KeyedArgToken | BareValue;

type Options = { arg: string };

export function isObjectPath (path: Path): path is ObjectPath {
  return typeof path.key0 === 'string';
}

export function isArrayPath (path: Path): path is ArrayPath {
  return typeof path.key0 === 'number';
}

export function isObjectSubKey (subKey: SubKey): subKey is ObjectSubKey {
  return isObjectPath(subKey.path);
}

export function isArraySubKey (subKey: SubKey): subKey is ArraySubKey {
  return isArrayPath(subKey.path);
}

export function isKeyedArgToken (token: ArgToken): token is KeyedArgToken {
  return token.type === 'fullKey' || token.type === 'subKey';
}


function escapeDoubleQuotes (str: string) {
  return str.replace(/\\([\s\S])|(")/g, '\\$1$2');
}

function unescapeString (chars: string[]) {
  return JSON.parse('"' + escapeDoubleQuotes(chars.join('')) + '"') as string;
}


function escapedChar (
  specialChars: string
): p.Parser<string,Options,string> {
  if (!specialChars.includes('\\')) {
    specialChars += '\\';
  }
  const escapes = [...specialChars]
    .map((c) => p.map(pc.str('\\' + c), () => c));
  return p.choice(
    ...escapes,
    pc.noneOf(specialChars)
  );
}

function stringOfChars (
  pChar: p.Parser<string,Options,string>
) {
  return p.map(p.many(pChar), unescapeString);
}

function quotedString (
  quoteChar: string
): p.Parser<string,Options,string> {
  return p.middle(
    pc.char(quoteChar),
    stringOfChars(escapedChar(quoteChar)),
    pc.char(quoteChar)
  );
}

const btString_ = quotedString('`');
const sqString_ = quotedString("'");
const dqString_ = quotedString('"');

const pathKey_        = stringOfChars(escapedChar('!.=[{'));
const arrayString_    = stringOfChars(escapedChar(',]'));
const unquotedString_ = stringOfChars(p.any);

const nullValue_   = p.map(pc.str('null'),  () => null );
const trueValue_   = p.map(pc.str('true'),  () => true );
const falseValue_  = p.map(pc.str('false'), () => false);
const emptyObject_ = p.map(pc.str('{}'),    () => ({}) );

const digits_ = p.many1(pc.oneOf('0123456789'));

const jsonFloat_ = p.map(
  pc.concat(
    p.option(pc.char('-'), ''),
    digits_,
    p.option(pc.concat(
      pc.char('.'),
      digits_
    ), ''),
    p.option(pc.concat(
      pc.oneOf('eE'),
      p.option(pc.oneOf('+-'), ''),
      digits_
    ), '')
  ),
  parseFloat
);

const unsignedInt_ = p.map(
  digits_,
  (chars) => parseInt(chars.join(''))
);

const primitiveValue_: p.Parser<string,Options,ArgValue> = p.choice(
  emptyObject_,
  nullValue_,
  trueValue_,
  falseValue_,
  jsonFloat_
);

const array_ = p.choice(
  p.ab(
    pc.char('['),
    pc.char(']'),
    () => []
  ) as p.Parser<string,Options,ArgValue[]>,
  p.middle(
    pc.char('['),
    p.sepBy1(
      p.recursive(() => arrayValue_),
      pc.char(',')
    ),
    pc.char(']')
  )
);

const arrayValue_: p.Parser<string,Options,ArgValue> = p.choice(
  primitiveValue_,
  array_,
  sqString_,
  dqString_,
  btString_,
  arrayString_
);

const bareValue_ = p.otherwise(
  p.choice(
    primitiveValue_,
    array_,
    sqString_,
    dqString_,
    btString_
  ),
  unquotedString_
);

const pathIndex_ = p.middle(
  pc.char('['),
  p.eitherOr(
    unsignedInt_,
    p.map(pc.char('_'), () => Number.NaN)
  ),
  pc.char(']')
);

const pathItem_: p.Parser<string,Options,string|number> = p.eitherOr(
  p.right(
    p.option(pc.char('.'), ''),
    pathIndex_
  ),
  p.right(
    pc.char('.'),
    pathKey_
  )
);

const objectPath_: p.Parser<string,Options,ObjectPath> = p.ab(
  pathKey_,
  p.many(pathItem_),
  (head, tail) => ({ key0: head, keys: tail })
);

const arrayPath_: p.Parser<string,Options,ArrayPath> = p.ab(
  pathIndex_,
  p.many(pathItem_),
  (head, tail) => ({ key0: head, keys: tail })
);

const path_: p.Parser<string,Options,Path> = p.eitherOr(
  arrayPath_,
  objectPath_
);

const bareValueToken_: p.Matcher<string,Options,BareValue> = p.map(
  bareValue_,
  (v) => ({ type: 'bareValue', value: v })
);

const keyToken_: p.Parser<string,Options,KeyedArgToken> = p.chain(
  p.eitherOr(
    p.map(p.discard(pc.char('-'), pc.char('-')), () => false),
    p.map(p.discard(pc.char(':')), () => true),
  ),
  (isSubkey) => {
    const pPath = (isSubkey) ? path_ : objectPath_;
    return p.choice(
      p.abc(
        pc.char('!'),
        pPath,
        p.end,
        (bang,path) => ({
          type: isSubkey ? 'subKey' : 'fullKey',
          path: path,
          data: { type: 'negation' }
        })
      ),
      p.ab(
        pPath,
        p.choice(
          p.map(p.end, () => 'bareKey' as const),
          p.map(p.discard(pc.char('['), pc.char(']'), p.end), () => 'arrayKey' as const),
          p.map(p.discard(pc.char('{'), pc.char('}'), p.end), () => 'objectKey' as const),
        ),
        (path, type) => ({
          type: isSubkey ? 'subKey' : 'fullKey',
          path: path,
          data: { type: type }
        })
      ),
      p.abc(
        pPath,
        p.right(pc.char('='), bareValue_),
        p.end,
        (path, value) => ({
          type: isSubkey ? 'subKey' : 'fullKey',
          path: path,
          data: { type: 'keyValue', value: value } as KeyData
        })
      ),
      p.error((data) => `Failed to parse the argument "${data.options.arg}".`)
    ) as p.Parser<string,Options,KeyedArgToken>;
  }
);

const matchArgToken_: p.Matcher<string,Options,ArgToken> = p.otherwise(
  keyToken_ as p.Parser<string,Options,ArgToken>,
  bareValueToken_
);


export function argToToken (arg: string): ArgToken {
  return pc.match(matchArgToken_, arg, { arg: arg });
}
