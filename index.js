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
const booksCollection = db.collections("books")


app.get('/', (req, res) => {
  res.send('Home Route')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})