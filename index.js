const express = require("express");
const app =express()
const {Redis} = require("ioredis");

const connectToRedis = new Redis.Cluster([{
    host: '127.0.0.1',
    port: 6379,
    password: '123456789'
}]);
connectToRedis.on('connect', () => {
    console.log('Connected to Redis');
});

connectToRedis.on('error', (err) => {
    console.error('Error connecting to Redis:', err);
});

app.listen(5000, (err)=>{
    if(err){
        console.log("error is not given");
    }else{
        console.log("server is runnning at 5000 port");
    }
})


const consumeGroupMessage = async(streamName, message) =>{
    const consumerInfo =  await consumerData(streamName, "ChatStreamGroup");

    const readNewGroupMessgae = await connectToRedis.xreadgroup("GROUP", "ChatStreamGroup", consumerInfo, "COUNT", 100, "BLOCK", "1000", "STREAMS", streamName, '>');

    if (readNewGroupMessgae && readNewGroupMessgae[0] && readNewGroupMessgae[0][1] && readNewGroupMessgae[0][1].length > 0) {
        const messagesData = readNewGroupMessgae[0][1];

        for (const [messageId, messageData] of messagesData) {
            let parsedData = messageData[1];
            parsedData = JSON.parse(parsedData);

            delete parsedData.command;
            if (parsedData?.type === "delete") {

                parsedData["updated_on"] = new Date();  
                
                let deleteChat = await ChatRepository.delete(parsedData?.id, parsedData);
                
                console.log(deleteChat, "deleteChat");
            }
            else if (parsedData?.is_edit)
            {
                parsedData["updated_on"] = new Date();

                let updateChat = await ChatRepository.update(parsedData?.messageId, parsedData);

                console.log(updateChat, "updateChat");

            }
            else {
                parsedData["created_on"] = new Date();

                parsedData["messageId"] = messageId

                let createChat = await ChatRepository.createChat(parsedData);

                console.log(parsedData, messageId, createChat, "Message Info : 68");
            }
            let ack = await RedisConnect.xack(streamName, 'ChatStreamGroup', messageId);
            
        }
    }


} 

const consumerData = async (streamName, groupName) =>{

    const checkconsumersdata= await connectToRedis.xinfo("CONSUMERS", streamName , groupName);

    if(checkconsumersdata && checkconsumersdata?.length > 0){
        let consimderdata = []

        for (const consumer of checkconsumersdata) {
            const [status] = consumer;
            if(status !== "pending"){
                consimderdata.push(consumer);
                return
            }
        }
    
        if(consimderdata.length > 0){
            return consimderdata[0]
    
        }else{
            const groupDetails = connectToRedis.xinfo("GROUPS", streamName );
    
            for (let i = 0; i < 20; i++) {
                consumerName = `Consumer:${groupDetails.length + i + 1}`;
                const newConsumer = await connectToRedis.xgroup("CREATECONSUMER", streamName, groupName, consumerName);
            }
            consumerData(streamName, groupName);
        }
    }else{
        const groupDetails = connectToRedis.xinfo("GROUPS", streamName );
    
        for (let i = 0; i < 20; i++) {
            consumerName = `Consumer:${groupDetails.length + i + 1}`;
            const newConsumer = await connectToRedis.xgroup("CREATECONSUMER", streamName, groupName, consumerName);
        }
        consumerData(streamName, groupName);
    }
  
    
}




const readConsumer = async() =>{
    while(1){
        await consumeGroupMessage("GroupMessage-newMsg", "Message")
    }
}


readConsumer()