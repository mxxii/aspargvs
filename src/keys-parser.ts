
import * as p from 'peberminta';

import { JsonArray, JsonObject, JsonValue, isJsonArray, isJsonObject, JsonPrimitive } from './json';
import { ArgToken, KeyData, ArrayPath, ObjectPath, isArrayPath, isObjectPath } from './key-token-parser';
import { Options } from './options';


export type ArraySubKeyValue = { path: ArrayPath, value: JsonValue };
export type ObjectSubKeyValue = { path: ObjectPath, value: JsonValue };

export type ArrayKeyValue = { type: 'arrayKeyValue', path: ObjectPath, value: JsonArray, subs: ArraySubKeyValue[] };
export type ObjectKeyValue = { type: 'objectKeyValue', path: ObjectPath, value: JsonObject, subs: ObjectSubKeyValue[] };
export type PrimitiveKeyValue = { type: 'primitiveKeyValue', path: ObjectPath, value: JsonPrimitive };

export type KeyValueResult = PrimitiveKeyValue | ArrayKeyValue | ObjectKeyValue;

type ArrayValue = { value: JsonArray, subs: ArraySubKeyValue[] };
type ObjectValue = { value: JsonObject, subs: ObjectSubKeyValue[] };
type PrimitiveValue = { value: JsonPrimitive };

type ValueResult = PrimitiveValue | ArrayValue | ObjectValue;


function keyDataToJsonValue (data: KeyData): JsonValue {
  switch (data.type) {
    case 'bareKey':   return true;
    case 'negation':  return false;
    case 'arrayKey':  return [];
    case 'objectKey': return ({});
    case 'keyValue':  return data.value;
  }
}

const arraySubKey_: p.Parser<ArgToken,Options,ArraySubKeyValue> =
  p.token((t) => (t.type === 'subKey' && isArrayPath(t.path)) ? { path: t.path, value: keyDataToJsonValue(t.data) } : undefined);

const objectSubKey_: p.Parser<ArgToken,Options,ObjectSubKeyValue> =
  p.token((t) => (t.type === 'subKey' && isObjectPath(t.path)) ? { path: t.path, value: keyDataToJsonValue(t.data) } : undefined);

const bareValue_: p.Parser<ArgToken,Options,ValueResult> =
  p.decide(p.token((t) => {
    if (t.type !== 'bareValue') {
      return undefined;
    }
    if (isJsonObject(t.value)) {
      return p.map(
        p.many(objectSubKey_),
        (ss) => ({ value: t.value, subs: ss } as ObjectValue)
      );
    }
    if (isJsonArray(t.value)) {
      return p.map(
        p.many(arraySubKey_),
        (ss) => ({ value: t.value, subs: ss } as ArrayValue)
      );
    }
    return p.emit({ value: t.value } as ValueResult);
  }));

function nestValueResult (vr: ValueResult, i: number): ArraySubKeyValue[] {
  const value0: ArraySubKeyValue = { path: { key0: i, keys: [] }, value: vr.value };
  if (isJsonArray(vr.value)) {
    return [
      value0,
      ...(vr as ArrayValue).subs.map(s => ({ path: { key0: i, keys: [s.path.key0, ...s.path.keys] }, value: s.value }))
    ];
  }
  if (isJsonObject(vr.value)) {
    return [
      value0,
      ...(vr as ObjectValue).subs.map(s => ({ path: { key0: i, keys: [s.path.key0, ...s.path.keys] }, value: s.value }))
    ];
  }
  return [value0];
}

const fullKey_: p.Parser<ArgToken,Options,KeyValueResult> =
  p.decide(p.token((t, data, i) => {
    if (t.type !== 'fullKey') {
      return undefined;
    }
    if (t.data.type === 'arrayKey' && data.tokens[i+1] && data.tokens[i+1].type === 'bareValue') {
      return p.map(
        p.many(bareValue_),
        (vs) => ({
          type: 'arrayKeyValue',
          path: t.path,
          value: [],
          subs: vs.flatMap(nestValueResult)
        })
      );
    }
    const value = keyDataToJsonValue(t.data);
    if (isJsonObject(value)) {
      return p.map(
        p.many(objectSubKey_),
        (ss) => ({
          type: 'objectKeyValue',
          path: t.path,
          value: value,
          subs: ss
        })
      );
    }
    if (isJsonArray(value)) {
      return p.map(
        p.many(arraySubKey_),
        (ss) => ({
          type: 'arrayKeyValue',
          path: t.path,
          value: value,
          subs: ss
        })
      );
    }
    return p.emit({
      type: 'primitiveKeyValue',
      path: t.path,
      value: value
    } as KeyValueResult);
  }));


export const parseAllKeys: p.Matcher<ArgToken, Options, KeyValueResult[]> =
  p.many(fullKey_);
