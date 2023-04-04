const Y = require("yjs");

exports.createDoc = ()=>{
    try{
        
        const yDoc = new Y.Doc();
        const uint8Array = Y.encodeStateAsUpdate(yDoc);
        const docBuffer = Buffer.from(uint8Array.buffer);
        return docBuffer;
    
    }catch(e){
        console.log(e);
        return null;
    }   

}

exports.updateDoc = (buffer,document)=>{
    

    const doc = new Y.Doc(); 
    const curState = new Uint8Array(document);
    const update = new Uint8Array(buffer);

    Y.applyUpdate(doc,curState);
    Y.applyUpdate(doc,update);
    
    const newDocArray = Y.encodeStateAsUpdate(doc);
    return Buffer.from(newDocArray.buffer);
}