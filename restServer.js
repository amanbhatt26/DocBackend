const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const {getDocument,putDocument} = require("./utils/dbUtils"); 
const {createDoc} = require("./utils/docUtils");
const uuid = require("uuid"); 

app.use(bodyParser.json());

/* Returns the state buffer of document with id = id */
app.get('/documents/:id', async (req, res) => {
  const id = req.params.id;
  console.log("request for id: ",id);
  /* Get Document from redis */
  const document = await getDocument(id);
  if(document) return res.status(200).json({status:"success",message:{type:"update", state:document}});

  return res.status(404).json({status:"error",message:`Document with ID: ${id} doesn't exist.`});
});

/* Creates a new document and returns its address */
app.post('/documents', async (req, res) => {
 
  const id = uuid.v4(); 
  
  const docBuffer = createDoc();
  if(docBuffer === null) return res.status(404).json({status:"error", message:"Couldn't create new document due to backend errors."});

  const documentId = await putDocument(id,docBuffer); 
  if(documentId !==null) return res.status(201).json({status:"success", message:{id:documentId}});
  
  return res.status(404).json({status:"error", message:"Couldn't create new document due to backend errors."});
    
});

const PORT = 2712;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});