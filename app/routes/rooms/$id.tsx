import { useState } from "react";
import { JoinRoomForm } from "~/components/join-room-form";
import { Room } from "~/components/room";

export interface RoomUser {
  id: string;
  userName: string;
  me: boolean;
}

export interface JoinRoomState {
  status: "idle" | "joining" | "error" | "joined";
  error?: string;
  users?: RoomUser[];
}

export default function RoomRoute() {
  const [joinRoomState, setJoinRoomState] = useState<JoinRoomState>({
    status: "idle",
  });

  return (
    <div className="bg-gray-900 h-full flex items-center justify-center">
      {joinRoomState.status === "joined" ? (
        <Room initialUsers={joinRoomState.users || []} />
      ) : (
        <JoinRoomForm
          joinRoomState={joinRoomState}
          setJoinRoomState={setJoinRoomState}
        />
      )}
    </div>
  );
}
