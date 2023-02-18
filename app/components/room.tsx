import { useCallback, useEffect, useState } from "react";
import type { RoomUser } from "~/routes/rooms/$id";
import { useWsContext } from "~/utils/ws-context";

interface RoomProps {
  initialUsers: RoomUser[];
}

const colors = [
  "#dc2626",
  "#ea580c",
  "#65a30d",
  "#16a34a",
  "#0891b2",
  "#2563eb",
  "#7c3aed",
  "#c026d3",
  "#e11d48",
];

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

  const getInitials = (fullName: string) => {
    const allNames = fullName.trim().split(" ");
    const initials = allNames.reduce((acc, curr, index) => {
      if (index === 0 || index === allNames.length - 1) {
        acc = `${acc}${curr.charAt(0).toUpperCase()}`;
      }
      return acc;
    }, "");
    return initials;
  };

  return (
    <ul className="flex gap-16 flex-wrap">
      {users.map((user) => (
        <li
          key={user.id}
          className="flex flex-col gap-4 items-center justify-center"
        >
          <div
            className="w-40 h-40 rounded-full flex items-center justify-center text-gray-50 text-6xl"
            style={{
              backgroundColor:
                colors[Math.floor(Math.random() * colors.length)],
            }}
          >
            {getInitials(user.userName)}
          </div>

          <p className="text-gray-50">
            {user.me ? `${user.userName} (You)` : user.userName}
          </p>
        </li>
      ))}
    </ul>
  );
}
