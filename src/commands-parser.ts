
import * as p from 'peberminta';

import { CommandResult, CommandResultWithData, parseAnyCommand } from './command-parser';
import { JsonObject } from './json';
import { Options } from './options';


export function parseAllCommands (
  data: p.Data<string,Options>,
  i: number
): p.Match<CommandResult | CommandResultWithData> {
  let acc: JsonObject = {};
  let position = i;
  let commandId: 'unparse' | 'inspect' | undefined = undefined;
  let tryNextCommand = true;
  while (tryNextCommand) {
    const r = parseAnyCommand(data, position);
    if (!r.matched) {
      tryNextCommand = false;
      continue;
    }
    switch (r.value.command) {
      case 'version':
      case 'help':
        return r;
      case 'inspect':
      case 'unparse':
        if (commandId && commandId !== r.value.command) {
          throw new Error(`Can't unparse and inspect json at the same time.`);
        }
        commandId = r.value.command;
        break;
      case 'json':
      case 'preset': {
        const next = (r.value).json;
        if (!data.options.handlers?.merge) {
          throw new Error(`Can't use 'json' or 'preset' command without supplying 'merge' handler.`);
        }
        acc = data.options.handlers.merge(acc, next);
        break;
      }
    }
    position = r.position;
  }
  return {
    matched: true,
    position: position,
    value: {
      type: 'commandWithData',
      command: commandId || 'json',
      json: acc
    }
  };
}
