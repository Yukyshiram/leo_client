import jsonwebtoken from "jsonwebtoken";
import { MAGIC_KEY, SEPARATOR, TOKEN_KEY } from "./constants.js";

export function createIss(privateKey: string): string {
  return jsonwebtoken.sign({}, privateKey, {
    algorithm: "RS256",
    expiresIn: 60,
    issuer: "I0wzMC00THVNbjBzKg==",
  });
}

function cleanToken(token: string): string {
  const separatorIndex = token.indexOf(SEPARATOR);
  const separated = token.slice(0, separatorIndex);
  const toMove = token.charAt(separatorIndex + 1);
  const numb = Number.parseInt(token.charAt(separatorIndex + 2), 10);
  const reduce = separated.slice(numb);
  const reduced = separated.slice(0, numb);
  return reduce + reduced + SEPARATOR + toMove;
}

function retriveToMove(transformed: string): number {
  const pos = transformed.indexOf(SEPARATOR);
  return transformed.slice(pos + 1, pos + 2).charCodeAt(0);
}

function decodeToken(transformedSessionID: string, key: string = MAGIC_KEY): string {
  const toMoved = retriveToMove(transformedSessionID);
  const length = transformedSessionID.slice(0, transformedSessionID.indexOf(SEPARATOR)).length;
  const transformToMoved = 122 - toMoved + 1;
  let token = "";

  for (let i = 0; i < length; i++) {
    let acc = transformedSessionID.charCodeAt(i) - key.charCodeAt(i);
    if (acc < 0) acc = transformToMoved + acc;
    token += String.fromCharCode(acc + toMoved);
  }

  return token;
}

function encodeToken(sessionID: string, key: string = MAGIC_KEY): string {
  const sessionIDLenght = sessionID.length;
  const toMove = Math.floor(15 * Math.random() + 33);
  const magic = 122 - toMove + 1;
  let text = "";

  for (let i = 0; i < sessionIDLenght; i++) {
    const acc = sessionID.charCodeAt(i) - toMove + key.charCodeAt(i) - toMove;
    text += String.fromCharCode((acc % magic) + toMove);
  }

  text += SEPARATOR + String.fromCharCode(toMove) + text;
  return cleanToken(text);
}

export function getSessionToken(sessionID: string): string {
  const key = decodeToken(cleanToken(TOKEN_KEY));
  return encodeToken(sessionID, key);
}
