# Redis_Streams

Redis Stream is data structure in redis for handling messages data. This data structure is used to add, read and consume data in real-time. it is used for processing data.

 ### Comcepts: 

1. Stream : its a data structure of log where we can add data into stream. Every data has unique genrated ID created dynamic.
2. Entry : Only single entry into stream with unique id in key value pair,
3. Consumer Groups :  Consumers in group is  used to manage large data in stream. We can create consumer based on the requirment like, number of message per consumer can handel
4. Consumer : A consumer is an entity that reads and processes entries from a stream. Each consumer within a consumer group is assigned specific entries to process.
   
## ADD Data to Stream
when we recive message from socket. if the message is group, check group is present or not. If not creat a group and add data to it.

```
 Redis.xgroup("CREAT", StreamName, GeoupName "0-0" MKSTREAM
  "0-0" if group is not created it will create with 0 lenght
   MKSTREAM  you can create it automatically with length of 0 by using the optional MKSTREAM.
```

```
  Redis.xadd(streamName, * , MessageName, MesaageData);
   * it will create ID automatically
```
### Syntax
```
 XADD mystream * message "Hello"
```
## Recive Data to Stream

1. create consumser
 
   ```
     async function createConsumer(streamName : any, groupName : any) {
    try {

        const groupDetails: any = await RedisConnect.xinfo("GROUPS", streamName);


        for (let i = 0; i < 100; i++) {

            consumerName = `Consumer:${groupDetails.length + i + 1}`;
            const newConsumer = await RedisConnect.xgroup("CREATECONSUMER", streamName, groupName, consumerName);
        }
    } catch (e) {
        console.log(e, "ERROR");
    }
     }
   ```
   ```
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
   ```

3. Check consumers and readData into consumer
```
   consumerName =await RedisConnect.xinfo("CONSUMERS", streamName, groupName);

   Redis.xreadgroup("GROUP", "ChatStreamGroup", consumerName, "COUNT", 100, "BLOCK", "1000", "STREAMS", streamName, '>');

   COUNT = 100 meand per consumer 100 messages
   BLOCk = 1000 means 1 sec hold
   ">" is mandatory
```
5. SendingS Acknowlgment, if ack didnt send it will pending state. 
 ```
  let ack = await RedisConnect.xack(streamName, 'ChatStreamGroup', messageId);
```
