
import * as p from 'peberminta';

import { isJsonArray, isJsonObject, type JsonArray, type JsonObject, type JsonPrimitive, type JsonValue } from './json.ts';
import { isArrayPath, isObjectPath, type ArgToken, type ArrayPath, type KeyData, type ObjectPath } from './key-token-parser.ts';
import { type Options } from './options.ts';


export type ArraySubKeyValue = { path: ArrayPath; value: JsonValue };
export type ObjectSubKeyValue = { path: ObjectPath; value: JsonValue };

export type ArrayKeyValue = { type: 'arrayKeyValue'; path: ObjectPath; value: JsonArray; subs: ArraySubKeyValue[] };
export type ObjectKeyValue = { type: 'objectKeyValue'; path: ObjectPath; value: JsonObject; subs: ObjectSubKeyValue[] };
export type PrimitiveKeyValue = { type: 'primitiveKeyValue'; path: ObjectPath; value: JsonPrimitive };

export type KeyValueResult = PrimitiveKeyValue | ArrayKeyValue | ObjectKeyValue;

type ArrayValue = { value: JsonArray; subs: ArraySubKeyValue[] };
type ObjectValue = { value: JsonObject; subs: ObjectSubKeyValue[] };
type PrimitiveValue = { value: JsonPrimitive };

type ValueResult = PrimitiveValue | ArrayValue | ObjectValue;


export function isArrayValue (vr: ValueResult): vr is ArrayValue {
  return isJsonArray(vr.value);
}

export function isObjectValue (vr: ValueResult): vr is ObjectValue {
  return isJsonObject(vr.value);
}

function keyDataToJsonValue (data: KeyData): JsonValue {
  switch (data.type) {
    case 'bareKey':   return true;
    case 'negation':  return false;
    case 'arrayKey':  return [];
    case 'objectKey': return ({});
    case 'keyValue':  return data.value;
  }
}

const arraySubKey_: p.Parser<ArgToken, Options, ArraySubKeyValue>
  = p.token(t => (t.type === 'subKey' && isArrayPath(t.path)) ? { path: t.path, value: keyDataToJsonValue(t.data) } : undefined);

const objectSubKey_: p.Parser<ArgToken, Options, ObjectSubKeyValue>
  = p.token(t => (t.type === 'subKey' && isObjectPath(t.path)) ? { path: t.path, value: keyDataToJsonValue(t.data) } : undefined);

const bareValue_: p.Parser<ArgToken, Options, ValueResult>
  = p.decide(p.token((t) => {
    if (t.type !== 'bareValue') {
      return undefined;
    }
    const v = t.value;
    if (isJsonObject(v)) {
      return p.map<ArgToken, Options, ObjectSubKeyValue[], ObjectValue>(
        p.many(objectSubKey_),
        ss => ({ value: v, subs: ss }),
      );
    }
    if (isJsonArray(v)) {
      return p.map<ArgToken, Options, ArraySubKeyValue[], ArrayValue>(
        p.many(arraySubKey_),
        ss => ({ value: v, subs: ss }),
      );
    }
    return p.emit<ArgToken, Options, ValueResult>({ value: v });
  }));

function nestValueResult (vr: ValueResult, i: number): ArraySubKeyValue[] {
  const value0: ArraySubKeyValue = { path: { key0: i, keys: [] }, value: vr.value };
  if (isArrayValue(vr)) {
    return [
      value0,
      ...vr.subs.map(s => ({ path: { key0: i, keys: [s.path.key0, ...s.path.keys] }, value: s.value })),
    ];
  }
  if (isObjectValue(vr)) {
    return [
      value0,
      ...vr.subs.map(s => ({ path: { key0: i, keys: [s.path.key0, ...s.path.keys] }, value: s.value })),
    ];
  }
  return [value0];
}

const fullKey_: p.Parser<ArgToken, Options, KeyValueResult>
  = p.decide(p.token((t, data, i) => {
    if (t.type !== 'fullKey') {
      return undefined;
    }
    if (t.data.type === 'arrayKey' && data.tokens[i + 1] && data.tokens[i + 1].type === 'bareValue') {
      return p.map(
        p.many(bareValue_),
        vs => ({
          type: 'arrayKeyValue',
          path: t.path,
          value: [],
          subs: vs.flatMap(nestValueResult),
        }),
      );
    }
    const v = keyDataToJsonValue(t.data);
    if (isJsonObject(v)) {
      return p.map(
        p.many(objectSubKey_),
        ss => ({
          type: 'objectKeyValue',
          path: t.path,
          value: v,
          subs: ss,
        }),
      );
    }
    if (isJsonArray(v)) {
      return p.map(
        p.many(arraySubKey_),
        ss => ({
          type: 'arrayKeyValue',
          path: t.path,
          value: v,
          subs: ss,
        }),
      );
    }
    return p.emit<ArgToken, Options, KeyValueResult>({
      type: 'primitiveKeyValue',
      path: t.path,
      value: v,
    });
  }));


export const parseAllKeys: p.Matcher<ArgToken, Options, KeyValueResult[]>
  = p.many(fullKey_);
