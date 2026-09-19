import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const routing = require('./.compiled-core/rack/routing.js');

const module = (id, role, inputs, outputs, groupId) => ({
  id,
  title: id,
  role,
  inputs,
  outputs,
  groupId,
});

test('automatic rack flow connects notes and audio without inventing CV routes', () => {
  const flow = routing.deriveAutomaticRackSignalFlow([
    module('player', 'player', ['note'], ['note']),
    module('instrument', 'instrument', ['note'], ['audio']),
    module('effect', 'effect', ['audio', 'cv'], ['audio']),
    module('mixer', 'mixer', ['audio'], ['audio']),
  ]);

  assert.deepEqual(flow.connections.map((connection) => [
    connection.sourceModuleId,
    connection.signal,
    connection.destinationModuleId,
  ]), [
    ['player', 'note', 'instrument'],
    ['instrument', 'audio', 'effect'],
    ['effect', 'audio', 'mixer'],
  ]);
  assert.equal(flow.unconnectedOutputCount, 1);
  assert.match(flow.note, /Logical routing preview only/);
});

test('automatic rack flow keeps grouped internals out of the top-level preview', () => {
  const flow = routing.deriveAutomaticRackSignalFlow([
    module('instrument', 'instrument', ['note'], ['audio']),
    module('grouped-effect', 'effect', ['audio'], ['audio'], 'folder-1'),
    module('mixer', 'mixer', ['audio'], ['audio']),
  ]);
  assert.deepEqual(flow.modules.map((entry) => entry.id), ['instrument', 'mixer']);
  assert.deepEqual(flow.connections.map((entry) => entry.destinationModuleId), ['mixer']);
});

test('new rack devices are inserted in musical signal order', () => {
  const existing = [
    module('instrument', 'instrument', ['note'], ['audio']),
    module('mixer', 'mixer', ['audio'], ['audio']),
  ];
  const withEffect = routing.insertRackModuleByRole(
    existing,
    module('effect', 'effect', ['audio'], ['audio']),
  );
  const withPlayer = routing.insertRackModuleByRole(
    withEffect,
    module('player', 'player', ['note'], ['note']),
  );
  assert.deepEqual(withPlayer.map((entry) => entry.id), [
    'player',
    'instrument',
    'effect',
    'mixer',
  ]);
});

test('explicitly grouped devices remain appended to their container state', () => {
  const existing = [module('mixer', 'mixer', ['audio'], ['audio'])];
  const grouped = module('grouped-player', 'player', ['note'], ['note'], 'folder-1');
  assert.deepEqual(
    routing.insertRackModuleByRole(existing, grouped).map((entry) => entry.id),
    ['mixer', 'grouped-player'],
  );
});
