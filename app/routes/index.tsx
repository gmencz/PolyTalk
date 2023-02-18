import { redirect } from "@remix-run/node";
import { generateRoomId } from "~/utils/ids.server";

export async function loader() {
  const newRoomId = generateRoomId();
  return redirect(`/rooms/${newRoomId}`);
}
