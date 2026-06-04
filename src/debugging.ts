import { Base64 } from 'js-base64';

function decodeUTF8(array: Uint8Array): string {
  const length = array.length;

  let out: string;
  let i: number;
  let c: number;
  let char2: number;
  let char3: number;

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

function encodeUTF8(string_: string): Uint8Array {
  const utf8: number[] = [];
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

export async function handleDebugRequest(
  body: { data?: string },
  respond?: (response: string) => Promise<void>
): Promise<void> {
  const { data } = body || {};
  let i: number;

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
  let response: string;

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
const handlers: Record<string, (args?: string) => unknown> = {};

async function handleDebugCommand(
  command: string,
  args?: string
): Promise<string> {
  const handler = handlers[command];

  let response: unknown;
  let success = false;

  try {
    if (handler) {
      response = await handler(args);
    } else {
      throw new Error('no such command');
    }

    success = true;
  } catch (error) {
    response = error instanceof Error ? error.toString() : String(error);
  } finally {
    response = JSON.stringify(response);
  }

  return `${success ? 'ok' : 'err'} ${String(response)}`;
}
