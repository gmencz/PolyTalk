import { createContext, useContext } from "react";
import type { Socket } from "socket.io-client";
import type { DefaultEventsMap } from "socket.io/dist/typed-events";

export const wsContext = createContext<
  Socket<DefaultEventsMap, DefaultEventsMap> | undefined
>(undefined);

export function useWsContext() {
  const socket = useContext(wsContext);
  return { socket };
}
