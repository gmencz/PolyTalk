import { useParams } from "@remix-run/react";
import type { JoinRoomState, RoomUser } from "~/routes/rooms/$id";
import { useWsContext } from "~/utils/ws-context";

type JoinRoomResponse = JoinRoomResponseSuccess | JoinRoomResponseError;

interface JoinRoomResponseSuccess {
  status: "ok";
  users: RoomUser[];
}

interface JoinRoomResponseError {
  status: "error";
  message: string;
}

interface JoinRoomFormProps {
  joinRoomState: JoinRoomState;
  setJoinRoomState: React.Dispatch<React.SetStateAction<JoinRoomState>>;
}

export function JoinRoomForm({
  joinRoomState,
  setJoinRoomState,
}: JoinRoomFormProps) {
  const { socket } = useWsContext();
  const params = useParams();

  const joinRoom = async (e: React.FormEvent<HTMLFormElement>) => {
    if (!socket) return;

    const form = e.currentTarget;
    const data = new FormData(form);
    const name = data.get("name");
    if (!name) {
      return;
    }

    setJoinRoomState({
      status: "joining",
    });

    try {
      const response: JoinRoomResponse = await socket
        .timeout(5000)
        .emitWithAck("join-room", { roomId: params.id, userName: name });

      if (response.status === "error") {
        return setJoinRoomState({
          status: "error",
          error: response.message,
        });
      }

      setJoinRoomState({
        status: "joined",
        users: response.users,
      });
    } catch (error) {
      console.error(error);
      return setJoinRoomState({
        status: "error",
        error: "Timed out joining room",
      });
    }
  };

  return (
    <form
      className="w-full max-w-sm"
      onSubmit={(e) => {
        e.preventDefault();
        joinRoom(e);
      }}
    >
      <div className="rounded-md border border-gray-500 px-5 py-4 shadow-sm focus-within:border-gray-300 focus-within:ring-1 focus-within:ring-gray-300">
        <label
          htmlFor="name"
          className="block font-medium text-gray-50 mb-1 text-lg"
        >
          Name
        </label>
        <input
          required
          type="text"
          name="name"
          id="name"
          className="block w-full border-0 p-0 text-gray-50 placeholder-gray-500 focus:ring-0 bg-transparent text-lg"
          placeholder="Jane Smith"
        />
      </div>

      <button
        disabled={joinRoomState.status === "joining"}
        type="submit"
        className="mt-4 w-full inline-flex items-center disabled:opacity-50 disabled:cursor-not-allowed justify-center rounded-md border border-transparent bg-teal-600 px-6 py-3 text-lg font-medium text-white shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
      >
        {joinRoomState.status === "joining" ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Joining...
          </>
        ) : (
          "Join"
        )}
      </button>

      {joinRoomState.error ? (
        <p className="mt-4 text-red-500">{joinRoomState.error}</p>
      ) : null}
    </form>
  );
}
