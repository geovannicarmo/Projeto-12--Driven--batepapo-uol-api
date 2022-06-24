import chalk from 'chalk'
import cors from 'cors'
import express from 'express'
import { MongoClient } from 'mongodb'
import dayjs from 'dayjs'




const app = express()
app.use(cors())
app.use(express.json());
let db;
const mongoClient = new MongoClient("mongodb://localhost:27017");



mongoClient.connect().then(() => {
    db = mongoClient.db("bate_papo_uol");
});

//Add new user

app.post('/participants',(req, res)=>{

    let aux=0
    
    db.collection("users").findOne({user: {name: req.body.name}}).then(opa=>{
        aux=0
       
        if(opa!==null){
            aux++
            res.sendStatus(409);
            return
        }

        if(aux===0){
            db.collection("users").insertOne({
                user: {name:req.body.name}, lastStatus: Date.now()
                
            }).then(() => {
                let hour=dayjs().format('HH:mm:ss')

                db.collection("msg").insertOne({to: 'Todos', text: 'entra na sala...', type:'status', from:req.body.name, time:hour}).then(() => {
                    res.sendStatus(201); 
                });
            })
            
            return
        }
    })

   

})

app.get('/participants',(req, res)=>{

    

     db.collection("users").find().toArray().then(participants => {
        let a = participants.map(participant=>participant.user)
        

         res.send(a)
     })    
})

app.post('/messages',(req, res)=>{
    let body =  req.body
    res.status(201)
    let from = req.headers.user
    let hour=dayjs().format('HH:mm:ss')

    db.collection("msg").insertOne({to: body.to, text: body.text, type:body.type, from, time:hour}).then(() => {
		res.sendStatus(201); 
	});

        db.collection("msg").find().toArray().then(msg => {
            console.log(msg);
        });
        
       

	});

    app.get('/messages',(req, res)=>{
        let user = req.headers.user

        let querymessage = {type: "message"}
        let queryStatus = {type: "status"}
        let queryTo = {to: user}
        let queryFrom = {from:user}
        db.collection("msg").find({$or: [queryFrom, queryTo, querymessage, queryStatus]}).toArray().then(msg=>{

            let limit;
            if(typeof(req.query.limit)===Number){

                limit=req.query.limit
            }
            
            res.status(201).send(msg.slice(-req.query.limit))
        })
    })


    app.post('/status', (req, res)=>{
        let user = req.headers.user
        console.log("status: "+user)

        db.collection("users").findOne({user: {name: user}}).then(iten=>{
           
           
            if(iten===null){
              
                res.sendStatus(404);
                return
            }
            console.log(iten)

            db.collection("users").updateOne(
                { lastStatus: iten.lastStatus },
                 {$set: {lastStatus: Date.now()}
                }).then(()=>res.sendStatus(200))
            
        })

        
    })
    
    
    setInterval(()=>{

            db.collection("users").deleteMany({
                lastStatus: {$lt: Date.now()-10000}
            })
            
            console.log(Date.now())
    }, 15000)


app.listen((5000),()=>(console.log(chalk.green("Server started in port 5000."))))