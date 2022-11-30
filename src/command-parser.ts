
import { existsSync, readFileSync } from 'node:fs';
import * as p from 'peberminta';

import { JsonObject, JsonValue, isJsonObject } from './json';
import { Options } from './options';
import { ciGetProperty, ciIncludes } from './util';


export type BareCommandId = 'version' | 'help' | 'inspect' | 'unparse';
export type CommandWithDataId = 'json' | 'preset' | 'inspect' | 'unparse';
type CommandId = BareCommandId | CommandWithDataId;
type DataResult = { type: 'data', json: JsonObject };
export type CommandResult = { type: 'command', command: BareCommandId };
export type CommandResultWithData = { type: 'commandWithData', command: CommandWithDataId, json: JsonObject };


function parseCommandName (
  id: BareCommandId, ...aliases: string[]
): p.Parser<string,Options,BareCommandId>;
function parseCommandName (
  id: CommandWithDataId, ...aliases: string[]
): p.Parser<string,Options,CommandWithDataId>;
function parseCommandName (
  id: CommandId, ...aliases: string[]
): p.Parser<string,Options,CommandId> {
  return p.token((t) => (ciIncludes(aliases, t)) ? id : undefined);
}

function bareCommandParser (
  condition: (data: p.Data<string, Options>, i: number) => boolean,
  parser: p.Parser<string, Options, BareCommandId>
): p.Parser<string,Options,CommandResult> {
  return p.condition(
    condition,
    p.map(parser, (v) => ({ type: 'command', command: v })),
    p.fail
  );
}

const parseVersionCommand: p.Parser<string,Options,CommandResult> = bareCommandParser(
  (data) => !!data.options.handlers?.version,
  p.eitherOr(
    parseCommandName('version', 'version', '-v'),
    p.left(parseCommandName('version', '--version'), p.end)
  )
);

const parseHelpCommand: p.Parser<string,Options,CommandResult> = bareCommandParser(
  (data) => !!data.options.handlers?.help,
  p.eitherOr(
    parseCommandName('help', 'help', '-h'),
    p.left(parseCommandName('help', '--help'), p.end)
  )
);

const parseInspectCommand: p.Parser<string,Options,CommandResult> = bareCommandParser(
  (data) => !!data.options.handlers?.inspect,
  parseCommandName('inspect', 'inspect', '-i')
);

const parseUnparseCommand: p.Parser<string,Options,CommandResult> = bareCommandParser(
  (data) => !!data.options.handlers?.unparse,
  parseCommandName('unparse', 'unparse', '-u')
);

const parseJsonFilename: p.Parser<string,Options,DataResult> = p.token(
  (fileName) => {
    if (!existsSync(fileName)) {
      throw new Error(`File "${fileName}" doesn't exist.`);
    }
    const json = JSON.parse(readFileSync(fileName, 'utf8')) as JsonValue;
    if (!isJsonObject(json)) {
      throw new Error(
        'Only json objects are allowed. Provided file contains an array or a primitive value.'
      );
    }
    return { type: 'data', json: json };
  },
  () => {
    throw new Error('Expected one more argument for a json file name.');
  }
);

const parseJsonCommand: p.Parser<string,Options,CommandResultWithData> = p.ab(
  parseCommandName('json', 'json', '-j'),
  parseJsonFilename,
  (ra, rb) => ({
    type: 'commandWithData',
    command: 'json',
    json: rb.json
  })
);

const parsePresetName: p.Parser<string,Options,DataResult> = p.token(
  (presetName, data) => {
    const presets = data.options.presets || {};
    const preset = ciGetProperty(presets, presetName);
    if (!preset) {
      const presetNames = Object.keys(presets).join(', ');
      throw new Error(
        `Unknown preset name: "${presetName}".\nKnown presets are: ${presetNames}.`
      );
    }
    return { type: 'data', json: preset.json };
  },
  () => {
    throw new Error('Expected one more argument for a preset name.');
  }
);

const parsePresetCommand: p.Parser<string,Options,CommandResultWithData> = p.condition(
  (data) => ((p) => !!p && Object.keys(p).length > 0)(data.options.presets),
  p.ab(
    parseCommandName('preset', 'preset', '-p'),
    parsePresetName,
    (ra, rb) => ({
      type: 'commandWithData',
      command: 'json',
      json: rb.json
    })
  ),
  p.fail
);

export const parseAnyCommand =
  p.choice<string, Options, CommandResult | CommandResultWithData>(
    parseVersionCommand,
    parseHelpCommand,
    parseJsonCommand,
    parsePresetCommand,
    parseInspectCommand,
    parseUnparseCommand
  );
