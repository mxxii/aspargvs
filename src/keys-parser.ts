// This file is responsible for parsing sequences of tokens (from key-token-parser.ts).
// Results will be further processed in args-parser.ts to produce the final JSON object.


import * as p from 'peberminta';

import { isJsonArray, isJsonObject, type JsonArray, type JsonObject, type JsonPrimitive, type JsonValue } from './json.ts';
import { isKeyTokenOfArray, isKeyTokenOfObject, type ArgToken, type ArrayPath, type KeyData, type ObjectPath } from './key-token-parser.ts';
import { type Options } from './options.ts';


export type KeyDataOfArray = { type: 'keyDataOfArray'; depth: number; path: ArrayPath; data: ResultData };
export type KeyDataOfObject = { type: 'keyDataOfObject'; depth: number; path: ObjectPath; data: ResultData };

export type KeyDataResult = KeyDataOfArray | KeyDataOfObject;


export type ArrayData = { value: JsonArray; subs: KeyDataOfArray[] };
export type ObjectData = { value: JsonObject; subs: KeyDataOfObject[] };
export type PrimitiveData = { value: JsonPrimitive };

export type ResultData = PrimitiveData | ArrayData | ObjectData;


export function isArrayData (r: ResultData): r is ArrayData {
  return isJsonArray(r.value);
}

export function isObjectData (r: ResultData): r is ObjectData {
  return isJsonObject(r.value);
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

const bareValueOfDepth_ = (depth: number): p.Parser<ArgToken, Options, ResultData> =>
  p.decide(p.token((t) => {
    if (t.type !== 'bareValue') {
      return undefined;
    }
    const v = t.value;
    if (isJsonObject(v)) {
      return p.map<ArgToken, Options, KeyDataOfObject[], ObjectData>(
        p.many(objectKeyOfDepth_(depth + 1)),
        ss => ({ value: v, subs: ss }),
      );
    }
    if (isJsonArray(v)) {
      return p.map<ArgToken, Options, KeyDataOfArray[], ArrayData>(
        p.many(arrayKeyOfDepth_(depth + 1)),
        ss => ({ value: v, subs: ss }),
      );
    }
    return p.emit<ArgToken, Options, ResultData>({ value: v });
  }));

const arrayOfBareValues_ = (depth: number): p.Parser<ArgToken, Options, ResultData> =>
  p.map<ArgToken, Options, ResultData[], ResultData>(
    p.many(bareValueOfDepth_(depth)),
    rds => ({
      value: [],
      subs: rds.map((rd, i) => ({
        type: 'keyDataOfArray' as const,
        depth: depth,
        path: { key0: i, keys: [] },
        data: rd,
      })),
    }),
  );

const arrayKeyOfDepth_ = (depth: number): p.Parser<ArgToken, Options, KeyDataOfArray> =>
  p.decide(p.token((t, data, i) => {
    if (!isKeyTokenOfArray(t) || t.depth !== depth) { return undefined; }

    if (t.data.type === 'arrayKey' && data.tokens[i + 1] && data.tokens[i + 1].type === 'bareValue') {
      return p.map(
        arrayOfBareValues_(depth),
        rd => ({
          type: 'keyDataOfArray' as const,
          depth: depth,
          path: t.path,
          data: rd,
        }),
      );
    }
    const v = keyDataToJsonValue(t.data);
    if (isJsonObject(v)) {
      return p.map(
        p.many(objectKeyOfDepth_(depth + 1)),
        ss => ({
          type: 'keyDataOfArray' as const,
          depth: depth,
          path: t.path,
          data: { value: v, subs: ss },
        }),
      );
    }
    if (isJsonArray(v)) {
      return p.map(
        p.many(arrayKeyOfDepth_(depth + 1)),
        ss => ({
          type: 'keyDataOfArray' as const,
          depth: depth,
          path: t.path,
          data: { value: v, subs: ss },
        }),
      );
    }
    return p.emit({
      type: 'keyDataOfArray' as const,
      depth: depth,
      path: t.path,
      data: { value: v } satisfies PrimitiveData,
    });
  }));

const objectKeyOfDepth_ = (depth: number): p.Parser<ArgToken, Options, KeyDataOfObject> =>
  p.decide(p.token((t, data, i) => {
    if (!isKeyTokenOfObject(t) || t.depth !== depth) { return undefined; }

    if (t.data.type === 'arrayKey' && data.tokens[i + 1] && data.tokens[i + 1].type === 'bareValue') {
      return p.map(
        arrayOfBareValues_(depth),
        r => ({
          type: 'keyDataOfObject' as const,
          depth: depth,
          path: t.path,
          data: r,
        }),
      );
    }
    const v = keyDataToJsonValue(t.data);
    if (isJsonObject(v)) {
      return p.map(
        p.many(objectKeyOfDepth_(depth + 1)),
        ss => ({
          type: 'keyDataOfObject' as const,
          depth: depth,
          path: t.path,
          data: { value: v, subs: ss },
        }),
      );
    }
    if (isJsonArray(v)) {
      return p.map(
        p.many(arrayKeyOfDepth_(depth + 1)),
        ss => ({
          type: 'keyDataOfObject' as const,
          depth: depth,
          path: t.path,
          data: { value: v, subs: ss },
        }),
      );
    }
    return p.emit({
      type: 'keyDataOfObject' as const,
      depth: depth,
      path: t.path,
      data: { value: v } satisfies PrimitiveData,
    });
  }));

export const parseAllKeys: p.Matcher<ArgToken, Options, KeyDataOfObject[]>
  = p.many(objectKeyOfDepth_(0));
