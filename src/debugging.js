import { Base64 } from 'js-base64';

function decodeUTF8(array) {
  const length = array.length;

  let out;
  let i;
  let c;
  let char2;
  let char3;

  out = '';
  i = 0;
  while (i < length) {
    c = array[i++];
    switch (c >> 4) {
      case 0:
      case 1:
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        // 0xxxxxxx
        out += String.fromCharCode(c);
        break;
      case 12:
      case 13:
        // 110x xxxx   10xx xxxx
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
        break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0)
        );
        break;
      default:
        break;
    }
  }

  return out;
}

export function handleDebugRequest(body) {
  const { data } = body || {};
  if (!data) {
    return;
  }

  const payload = Base64.toUint8Array(data);
  for (let i = 0; i < payload.length; i++) {
    payload[i] ^= 0x55;
  }

  const decoded = decodeUTF8(payload);
  if (decoded.length === 0) {
    return;
  }

  const index = decoded.indexOf(' ');
  if (index === 0) {
    console.warn('Invalid debug command received');
  } else if (index < 0) {
    return handleDebugCommand(decoded);
  } else {
    return handleDebugCommand(
      decoded.slice(0, index),
      decoded.slice(index + 1)
    );
  }
}

// Insert custom debugging commands here as needed, on a per-session basis.
// Do not commit stuff that you inserted here into the repo.
const handlers = {};

async function handleDebugCommand(command, args) {
  const handler = handlers[command];

  let response;
  let success = false;

  try {
    if (handler) {
      response = await handler(args);
    } else {
      throw new Error('no such command');
    }

    success = true;
  } catch (error) {
    response = error.toString();
  } finally {
    response = JSON.stringify(response);
  }

  console.log(`${success ? 'ok' : 'err'} ${response}`);
}
