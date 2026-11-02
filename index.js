import express from "express";
import cors from "cors"
import "dotenv/config"
import { MongoClient } from "mongodb";

const app = express();
const port = process.env.port || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB
const client = new MongoClient(process.env.MONGODB_URI) ;

const connectToMongoDB = async () =>{
  try{
    await client.connect()
    console.log("Connected to MongoDB");
    return client
  }catch(err){
    console.dir(err);
  }
}

const connected = await connectToMongoDB();
const db = connected.db("book-nook");
const booksCollection = db.collection("books");


app.get('/', (req, res) => {
  res.send('Home Route')
})


//post books
app.post("/books",async (req,res)=>{
  const bookData = req.body;
  const result = await booksCollection.insertOne(bookData)
  console.log(result);
  res.send(result)
})

// http://localhost:8000/books
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})