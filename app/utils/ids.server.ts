import { nanoid } from "nanoid";

export function generateRoomId() {
  return nanoid(10);
}
