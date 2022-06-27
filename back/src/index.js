import chalk from 'chalk'
import cors from 'cors'
import express from 'express'
import { MongoClient } from 'mongodb'
import dayjs from 'dayjs'
import joi from 'joi'
import dotenv from "dotenv"

dotenv.config()
const PORT = process.env.PORTA;
const SERVERMONGO= process.env.SERVERMONGO


const nameSchema = joi.object({

name:joi.string().required()
});

const messagesSchema = joi.object({

    to:joi.string().required(),
    text:joi.string().required(),
    type:joi.string().valid("message", "private_message").required()
})


const app = express()
app.use(cors())
app.use(express.json());
let db;
const mongoClient = new MongoClient(SERVERMONGO);



mongoClient.connect().then(() => {
    db = mongoClient.db("bate_papo_uol");
});

//Add new user

app.post('/participants',(req, res)=>{

    const validation = nameSchema.validate({name: req.body.name})
    if (validation.error) {
        res.status(422).send(validation.error.details[0].message)
        return
      }

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

    const validation = messagesSchema.validate(req.body, { abortEarly: true });

    if (validation.error) {
        res.status(422).send(validation.error.details[0].message)
        return
      }


    let body =  req.body
    let from = req.headers.user
    let hour=dayjs().format('HH:mm:ss')

    
     db .collection("users").findOne({user: {name: from}}).then((query)=>{

      

        if(query===null){
            res.status(422).send("Usuario não logado")
            return
        }

         
         db.collection("msg").insertOne({to: body.to, text: body.text, type:body.type, from, time:hour}).then(() => {
             res.sendStatus(201); 
            });
            
        })

    
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
        

        db.collection("users").findOne({user: {name: user}}).then(iten=>{
           
           
            if(iten===null){
              
                res.sendStatus(404);
                return
            }
          

            db.collection("users").updateOne(
                { lastStatus: iten.lastStatus },
                 {$set: {lastStatus: Date.now()}
                }).then(()=>res.sendStatus(200))
            
        })

        
    })
    
    
    setInterval(()=>{

        db.collection("users").find({
            lastStatus: {$lt: Date.now()-10000}
        }).toArray().then((query)=>{
           
            let hour=dayjs().format('HH:mm:ss')

         query.map((date)=>   db.collection("msg").insertOne({to: 'Todos', text: 'saiu da sala...', type:'status', from:date.user.name, time:hour}).then(() => {
            
            })
        )
            
            db.collection("users").deleteMany({
                    lastStatus: {$lt: Date.now()-10000}
                })

                
            })
            
    }, 15000)


app.listen((PORT),()=>(console.log(chalk.green("Server started in port 5000."))))