import path from "path";
import express from "express";
import compression from "compression";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import { createRequestHandler } from "@remix-run/express";

const MODE = process.env.NODE_ENV;
const BUILD_DIR = path.join(process.cwd(), "build");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

interface JoinRoomMessage {
  userName: string;
  roomId: string;
}

interface User {
  id: string;
  rooms: {
    userName: string;
    roomId: string;
  }[];
}

interface RoomUser {
  id: string;
  userName: string;
}

const users = new Map<string, User>();
const roomsUsers = new Map<string, RoomUser[]>();

io.on("connection", (socket) => {
  const user: User = {
    id: socket.id,
    rooms: [],
  };

  users.set(user.id, user);
  console.log(`${user.id} connected`);

  socket.on("disconnect", () => {
    user.rooms.forEach(({ roomId, userName }) => {
      const roomUsers = roomsUsers.get(roomId);
      if (roomUsers) {
        const updatedUsers = roomUsers.filter(({ id }) => id !== user.id);

        if (updatedUsers.length === 0) {
          roomsUsers.delete(roomId);
        } else {
          io.to(roomId).emit("user-left", user.id);
          roomsUsers.set(roomId, updatedUsers);
        }
      }
    });

    users.delete(user.id);
    console.log(`${user.id} disconnected`);
  });

  socket.on(
    "join-room",
    async ({ roomId, userName }: JoinRoomMessage, callback) => {
      const roomUsers = roomsUsers.get(roomId);
      if (roomUsers) {
        if (roomUsers.length >= 10) {
          return callback({
            status: "error",
            message: "This room is currently full",
          });
        }

        const existingUserName = roomUsers.some(
          (user) => user.userName === userName
        );

        if (existingUserName) {
          return callback({
            status: "error",
            message: "Name not available",
          });
        }
      }

      await socket.join(roomId);

      const updatedUsers = [...(roomUsers || []), { id: user.id, userName }];
      roomsUsers.set(roomId, updatedUsers);
      user.rooms.push({
        roomId,
        userName,
      });

      socket.to(roomId).emit("user-joined", { id: user.id, userName });

      callback({
        status: "ok",
        users: updatedUsers.map((updatedUser) => ({
          ...updatedUser,
          me: updatedUser.id === user.id,
        })),
      });

      console.log(`${user.id} joined room ${roomId}`);
    }
  );
});

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// Remix fingerprints its assets so we can cache forever.
app.use(
  "/build",
  express.static("public/build", { immutable: true, maxAge: "1y" })
);

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("public", { maxAge: "1h" }));

app.use(morgan("tiny"));

app.all(
  "*",
  MODE === "development"
    ? (req, res, next) => {
        purgeRequireCache();

        return createRequestHandler({
          build: require(BUILD_DIR),
          mode: MODE,
        })(req, res, next);
      }
    : createRequestHandler({
        build: require(BUILD_DIR),
        mode: MODE,
      })
);

const port = process.env.PORT || 3000;

httpServer.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't let
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, but then you'll have to reconnect to databases/etc on each
  // change. We prefer the DX of this, so we've included it for you by default
  for (const key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      delete require.cache[key];
    }
  }
}
