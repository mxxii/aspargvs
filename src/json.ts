
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonArray | JsonObject;

export function isJsonArray (value: JsonValue): value is JsonArray {
  return typeof value === 'object'
    && Array.isArray(value);
}

export function isJsonObject (value: JsonValue): value is JsonObject {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value);
}

export function getType (value: JsonValue):
'boolean' | 'number' | 'string' | 'null' | 'array' | 'object' {
  switch (typeof value) {
    case 'boolean':
      return 'boolean';
    case 'number':
      return 'number';
    case 'string':
      return 'string';
    case 'object':
      return (value === null) ? 'null' :
        (isJsonArray(value)) ? 'array' :
          'object';
    default:
      throw new Error(`Expected valid JsonValue, got ${typeof value}`);
  }
}

export function setJsonArrayItem (
  arr: JsonArray,
  value: JsonValue,
  keyTransform: ((key: string) => string) | undefined,
  key0: number,
  ...keys: (string | number)[]
): JsonArray {
  const i = (Number.isNaN(key0))
    ? arr.length
    : key0;
  if (keys.length === 0) {
    arr[i] = value;
  } else {
    if (typeof arr[i] === 'undefined') {
      arr[i] = (typeof keys[0] === 'number') ? [] : {};
    }
    setNested(arr[i], value, keyTransform, keys[0], ...keys.slice(1));
  }
  return arr;
}

export function setJsonObjectItem (
  obj: JsonObject,
  value: JsonValue,
  keyTransform: ((key: string) => string) | undefined,
  key0: string,
  ...keys: (string | number)[]
): JsonObject {
  if (keyTransform) {
    key0 = keyTransform(key0);
  }
  if (keys.length === 0) {
    if (typeof obj[key0] !== 'undefined') {
      if (Array.isArray(value) && Array.isArray(obj[key0])) {
        (obj[key0] as JsonValue[]).push(...value);
      } else {
        throw new Error(
          `Trying to set "${key0}" key multiple times.`
        );
      }
    } else {
      obj[key0] = value;
    }
  } else {
    if (typeof obj[key0] === 'undefined') {
      obj[key0] = (typeof keys[0] === 'number') ? [] : {};
    }
    setNested(obj[key0], value, keyTransform, keys[0], ...keys.slice(1));
  }
  return obj;
}

function setNested (
  nested: JsonValue,
  value: JsonValue,
  keyTransform: ((key: string) => string) | undefined,
  key1: number | string,
  ...keys: (number | string)[]
): void {
  if (isJsonArray(nested) && typeof key1 === 'number') {
    setJsonArrayItem(nested, value, keyTransform, key1, ...keys);
  } else if (isJsonObject(nested) && typeof key1 === 'string') {
    setJsonObjectItem(nested, value, keyTransform, key1, ...keys);
  } else {
    throw new Error(
      `Trying to access ${typeof key1} key ${JSON.stringify(key1)} of an ${getType(nested)}.`
    );
  }
}
