const {client} = require("../Database");
const {commandOptions} = require("redis");

exports.getDocument = async (id)=>{
    
    const docExists = await client.exists(id);
    if (docExists) {

        try{
            
            const docBuffer = await client.hGetAll(
                commandOptions({ returnBuffers: true }),
                id
            );
    
            return docBuffer.doc;

        }catch(e){
            console.log(e);
            return null; 
        }
        
    
      } 
    
    return null;   
}

exports.putDocument = async (id,buffer)=>{
    try{
        await client.hSet(id, "doc", buffer);
        return id;
    }catch(e){
        console.log(e);
        return null;
    }
}