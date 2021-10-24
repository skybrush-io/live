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
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | (char3 & 0x3f)
        );
        break;
      default:
        break;
    }
  }

  return out;
}

function encodeUTF8(string_) {
  const utf8 = [];
  for (let i = 0; i < string_.length; i++) {
    let charcode = string_.charCodeAt(i);
    if (charcode < 0x80) utf8.push(charcode);
    else if (charcode < 0x800) {
      utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
    } else if (charcode < 0xd800 || charcode >= 0xe000) {
      utf8.push(
        0xe0 | (charcode >> 12),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
    // surrogate pair
    else {
      i++;
      // UTF-16 encodes 0x10000-0x10FFFF by
      // subtracting 0x10000 and splitting the
      // 20 bits of 0x0-0xFFFFF into two halves
      charcode =
        0x10000 +
        (((charcode & 0x3ff) << 10) | (string_.charCodeAt(i) & 0x3ff));
      utf8.push(
        0xf0 | (charcode >> 18),
        0x80 | ((charcode >> 12) & 0x3f),
        0x80 | ((charcode >> 6) & 0x3f),
        0x80 | (charcode & 0x3f)
      );
    }
  }

  return new Uint8Array(utf8);
}

export async function handleDebugRequest(body, respond) {
  const { data } = body || {};
  let i;

  if (!data) {
    return;
  }

  const payload = Base64.toUint8Array(data);
  for (i = 0; i < payload.length; i++) {
    payload[i] ^= 0x55;
  }

  const decoded = decodeUTF8(payload);
  if (decoded.length === 0) {
    return;
  }

  const index = decoded.indexOf(' ');
  let response;

  if (index === 0) {
    response = 'err Invalid command';
  } else if (index < 0) {
    response = await handleDebugCommand(decoded);
  } else {
    response = await handleDebugCommand(
      decoded.slice(0, index),
      decoded.slice(index + 1)
    );
  }

  if (respond) {
    const encoded = encodeUTF8(response);
    for (i = 0; i < encoded.length; i++) {
      encoded[i] ^= 0x55;
    }

    await respond(Base64.fromUint8Array(encoded));
  } else {
    console.log(response);
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

  return `${success ? 'ok' : 'err'} ${response}`;
}
