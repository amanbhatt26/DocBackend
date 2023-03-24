const WebSocket = require('ws');
const Y = require("yjs"); 

const wss = new WebSocket.Server({ port: 8080 });

const sockets = [];
const yDoc = new Y.Doc(); 
const yArray = yDoc.getArray("editor-1"); 

wss.on('connection', function connection(ws) {
  sockets.push(ws);

  const uint8Array = Y.encodeStateAsUpdate(yDoc); 
  console.log(Buffer.from(uint8Array.buffer));
  ws.send(JSON.stringify({type:"init", uint8Array:Buffer.from(uint8Array.buffer)})); 

  console.log(`New socket connected. Total number of sockets: ${sockets.length}`);
  ws.on('message', function incoming(message) {
    console.log(`Received message:`, message);


    Y.applyUpdate(yDoc, message); 
    // Forward message to all other sockets
    sockets.forEach(function (socket) {
      if (socket !== ws && socket.readyState === WebSocket.OPEN) {
        const data = {type:"update", uint8Array:message}; 
        socket.send(JSON.stringify(data)); 
      }
    });
  });

  ws.on('close', function () {
    const index = sockets.indexOf(ws);
    if (index !== -1) {
      sockets.splice(index, 1);
      console.log(`Socket disconnected. Total number of sockets: ${sockets.length}`);
    }
  });


  
});