const WebSocket = require("ws");
const Y = require("yjs");
const redis = require("redis");
const { commandOptions } = require("redis");

const sockets = [];

/* Redis Setup */
const client = redis.createClient({});

(async () => {
  await client.connect();
})();

client.on("error", (err) => {
  console.log("Error " + err);
});

client.on("ready", () => {
  console.log("Connected to redis");
});

// (async () => {
//   const uint8Array = Y.encodeStateAsUpdate(yDoc);
//   const buffer = Buffer.from(uint8Array.buffer);
//   await client.hSet("foo", "field", buffer);
//   const value = await client.hGetAll(
//     commandOptions({ returnBuffers: true }),
//     "foo"
//   );

// })();

/* Websocket Setup */
const wss = new WebSocket.Server({ port: 8080 });
wss.on("connection", async function connection(ws) {
  sockets.push(ws);

  const docExists = await client.exists("document");
  if (docExists) {
    const docBuffer = await client.hGetAll(
      commandOptions({ returnBuffers: true }),
      "document"
    );
    ws.send(JSON.stringify({ type: "init", uint8Array: docBuffer.field }));
  } else {
    const yDoc = new Y.Doc();
    const uint8Array = Y.encodeStateAsUpdate(yDoc);
    const docBuffer = Buffer.from(uint8Array.buffer);
    ws.send(JSON.stringify({ type: "init", uint8Array: docBuffer }));
    await client.hSet("document", "field", docBuffer);
  }

  console.log(
    `New socket connected. Total number of sockets: ${sockets.length}`
  );

  ws.on("message", async function incoming(message) {
    console.log(`Received message:`, message);

    /*DocBuffer setup*/
    const docBuffer = await client.hGetAll(
      commandOptions({ returnBuffers: true }),
      "document"
    );

    const yDoc = new Y.Doc();
    Y.applyUpdate(yDoc, docBuffer.field);
    Y.applyUpdate(yDoc, message);

    const uint8Array = Y.encodeStateAsUpdate(yDoc);
    const newDocBuffer = Buffer.from(uint8Array.buffer);
    console.log("docBuffer: ", docBuffer);
    console.log("newDocBuffer: ", newDocBuffer);
    await client.hSet("document", "field", newDocBuffer);

    // Forward message to all other sockets
    sockets.forEach(function (socket) {
      if (socket !== ws && socket.readyState === WebSocket.OPEN) {
        const data = { type: "update", uint8Array: message };
        socket.send(JSON.stringify(data));
      }
    });
  });

  ws.on("close", function () {
    const index = sockets.indexOf(ws);
    if (index !== -1) {
      sockets.splice(index, 1);
      console.log(
        `Socket disconnected. Total number of sockets: ${sockets.length}`
      );
    }
  });
});
