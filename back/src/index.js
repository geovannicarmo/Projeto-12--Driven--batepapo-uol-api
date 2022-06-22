import chalk from 'chalk'
import cors from 'cors'
import express from 'express'
import { MongoClient } from 'mongodb'



const app = express()
app.use(cors())
app.use(express.json());
let db;
const mongoClient = new MongoClient("mongodb://localhost:27017");

mongoClient.connect().then(() => {
    db = mongoClient.db("meu_lindo_projeto");
});

app.post('/participants',(req, res)=>{
    let name =  req.body
    res.status(201)
    console.log (name)
    console.log (Date.now())
})

app.post('/messages',(req, res)=>{
    // let name =  req.body
    // res.status(201)
    // console.log (name)
    // console.log (req.headers.user)

    db.collection("recipes").insertOne(req.body).then(() => {
		res.sendStatus(201); 
	});

        db.collection("recipes").find().toArray().then(recipes => {
            console.log(recipes);
        });
        
       

	});


app.listen((5000),()=>(console.log(chalk.green("Server started in port 5000."))))