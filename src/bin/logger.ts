const blue = "\x1b[34m%s\x1b[0m";
const green = "\x1b[32m%s\x1b[0m";
const red = "\x1b[31m%s\x1b[0m";
const yellow = "\x1b[33m%s\x1b[0m";

export function logInfo(msg: string) {
  console.log(blue, `[INFO]: ${msg}`);
}

export function logError(msg: string) {
  console.error(red, `[ERROR]: ${msg}`);
}

export function logSuccess(msg: string) {
  console.log(green, `[SUCCESS]: ${msg}`);
}

export function logWarn(msg: string) {
  console.log(yellow, `[WARN]: ${msg}`);
}
