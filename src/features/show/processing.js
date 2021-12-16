/**
 * @file Functions for processing a show file as opened by the user in ZIP
 * format.
 */

import RefParser from '@apidevtools/json-schema-ref-parser';
import JSZip from 'jszip';

import { MAX_DRONE_COUNT } from './constants';

/**
 * Async function that blocks until the next idle cycle of the browser. Used to
 * ensure that the browser UI does not block when resolving references in the
 * show file.
 */
const idle = async () =>
  new Promise((resolve) => {
    requestIdleCallback(resolve);
  });

/**
 * Runs some basic checks on a JSON-based show specification to see whether it
 * looks like a valid show specification.
 *
 * Raises appropriate errors if the show specification does not look like a
 * valid one.
 *
 * @param {object} spec  the specification to validate
 */
function validateShowSpecification(spec) {
  // TODO(ntamas): write a proper JSON-Schema specification for the show files
  // and use that.

  if (spec.version !== 1) {
    throw new Error('Only version 1 files are supported');
  }

  if (!spec.swarm || !Array.isArray(spec.swarm.drones)) {
    throw new Error('Show specification contains no drones');
  }

  const { drones } = spec.swarm;

  if (drones.length > MAX_DRONE_COUNT) {
    throw new Error(
      `Too many drones in show file; maximum allowed is ${MAX_DRONE_COUNT}`
    );
  }

  for (const drone of drones) {
    if (
      !drone.settings ||
      typeof drone.settings !== 'object' ||
      typeof drone.settings.trajectory !== 'object'
    ) {
      throw new Error('Found drone without trajectory in show specification');
    }

    if (drone.settings.trajectory.version !== 1) {
      throw new Error('Only version 1 trajectories are supported');
    }
  }

  if (spec.environment === undefined) {
    spec.environment = {};
  } else if (typeof spec.environment !== 'object') {
    throw new TypeError('Invalid environment in show specification');
  }

  const { environment } = spec;

  if (environment.type === undefined) {
    environment.type = 'outdoor';
  }

  if (!['outdoor', 'indoor'].includes(environment.type)) {
    throw new Error('Invalid environment type in show specification');
  }
}

/**
 * Helper function that creates a JSONRef resolver that resolves references
 * from a given ZIP file.
 *
 * @param {JSZip} zip  the JSZip object representing the ZIP file in which the
 *        references are resolved
 */
function createZIPResolver(zip) {
  return {
    order: 1,

    canRead: /^zip:/,

    async read(file) {
      const url = new URL(decodeURI(file.url));
      if (url.protocol !== 'zip:') {
        throw new Error(`unsupported protocol: ${url.protocol}`);
      }

      await idle();

      // TODO: use strings only for JSON and YAML files; use some binary
      // encoding for embedded assets
      return zip.file(url.pathname).async('string');
    },
  };
}

/**
 * Loads a drone show from a file.
 *
 * @param  {File}  file  the file that the user selected
 * @return {object} the parsed show specification
 */
export async function loadShowFromFile(file) {
  const zip = await JSZip.loadAsync(file);

  // Create a JSON reference to the main show specification file and then
  // let the JSONRef parser handle the rest
  const root = { $ref: 'zip:show.json' };

  // Load the main show specification file and parse it as JSON
  // const showSpecAsString = await zip.file('show.json').async('string');

  // Resolve all $ref references in the show specification
  const showSpec = await RefParser.dereference(root, {
    resolve: {
      zip: {
        ...createZIPResolver(zip),
      },
    },
  });

  validateShowSpecification(showSpec);

  return showSpec;
}
