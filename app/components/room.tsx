import { useCallback, useEffect, useState } from "react";
import type { RoomUser } from "~/routes/rooms/$id";
import { useWsContext } from "~/utils/ws-context";

interface RoomProps {
  initialUsers: RoomUser[];
}

export function Room({ initialUsers }: RoomProps) {
  const { socket } = useWsContext();
  const [users, setUsers] = useState(initialUsers);

  const onUserJoined = useCallback((user: RoomUser) => {
    setUsers((current) => [...current, { ...user, me: false }]);
  }, []);

  const onUserLeft = useCallback((userId: string) => {
    setUsers((current) => current.filter(({ id }) => id !== userId));
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("user-joined", onUserJoined);
    socket.on("user-left", onUserLeft);

    return () => {
      socket.off("user-joined", onUserJoined);
      socket.off("user-left", onUserLeft);
    };
  }, [onUserJoined, onUserLeft, socket]);

  console.log({ users });

  return null;
}
