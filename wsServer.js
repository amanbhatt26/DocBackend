const WebSocket = require("ws");
const Y = require("yjs");

const {client} = require("./Database");
const { getDocument, putDocument } = require("./utils/dbUtils");
const { updateDoc } = require("./utils/docUtils");

const sockets = [];


/* Websocket Setup */
const wss = new WebSocket.Server({port:8080}); 

wss.on("connection", async function(ws){

    /* Store the newly created socket */
    sockets.push(ws); 
    console.log(`New socket connected. Total Socket Connections: ${sockets.length}`); 

    
    /* Setup listeners on the socket */
    ws.on("message", async (message)=>{
        
        const data = JSON.parse(message);
        console.log(data);
        try{
            switch(data.type){
                case "document":
                    ws.documentId = data.state;
                    const curDocument = await getDocument(ws.documentId);
                    ws.send(JSON.stringify({type:"update",state:curDocument}));
                    break;
                case "cursor":
                    ws.cursorId = data.state;
                    break;
                case "update":
                    const document = await getDocument(ws.documentId);
                    const newDocument = updateDoc(data.state.data, document); 
                    
                    /* Send the changes to connected peers with same documentId*/

                    sockets.forEach((socket)=>{
                        if(socket !== ws && socket.readyState === WebSocket.OPEN && socket.documentId === ws.documentId){

                            const peerData = {
                                type:"update",
                                state: Buffer.from(data.state.data)
                            };
                            socket.send(JSON.stringify(peerData)); 
                        }
                    })

                    /* Put the new state in the db */
                    await putDocument(ws.documentId, newDocument);
                    break;
                default:
                    console.log("Client sent bad data: ",data);
            }

        }catch(e){
            
            console.log(e);
        }
    })

    ws.on("close", async ()=>{

        const index = sockets.indexOf(ws);
        if(index !== -1){
            sockets.splice(index,1);
            console.log(`Socket disconnected. Total Sockets: ${sockets.length}`); 
        }

        /* Remove the cursor */ 
        const document = await getDocument(ws.documentId);
        const yDoc = new Y.Doc();
        Y.applyUpdate(yDoc, new Uint8Array(document)); 
        const array = yDoc.getArray(ws.documentId);
        deleteCursorFromYArray(array, ws.cursorId);

        const encodedState = Y.encodeStateAsUpdate(yDoc);
        const stateBuffer = Buffer.from(encodedState);

        await putDocument(ws.documentId,stateBuffer);
        /* Send the changes to connected peers with same documentId*/

        sockets.forEach((socket)=>{
            if(socket !== ws && socket.readyState === WebSocket.OPEN && socket.documentId === ws.documentId){

                const peerData = {
                    type:"update",
                    state: stateBuffer
                };
                socket.send(JSON.stringify(peerData)); 
            }
        })
    })
   
})

function deleteCursorFromYArray(array, id) {
  let delIndex = -1;
  array?.forEach((el, index) => {
    if (el.type === "cursor") {
      if (el.id === id) delIndex = index;
    }
  });

  if (delIndex === -1) return;
  array?.delete(delIndex, 1);
}
