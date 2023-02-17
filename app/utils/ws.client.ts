import io from "socket.io-client";

export function connect() {
  return io();
}
