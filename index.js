import express from "express";
import cors from "cors"
import "dotenv/config"
import { MongoClient, ObjectId } from "mongodb";

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

// get books
app.get("/books",async(req,res)=>{
  const result = await booksCollection.find({}).sort({ _id: -1 }).toArray()
  res.send(result)
})

// get specific item
app.get("/books/:id",async(req,res)=>{
  const {id} = req.params;
  const query = {_id: new ObjectId(id)};
  const result = await booksCollection.findOne(query);
  res.send(result);
})

// get specific item by email
app.get("/my-books/:email",async(req,res)=>{
  const {email} = req.params;
  const query = {userEmail: email};
  const result = await booksCollection.find(query).toArray();
  res.send(result);
})

//post books
app.post("/books",async (req,res)=>{
  const bookData = req.body;
  const result = await booksCollection.insertOne(bookData)
  console.log(result);
  res.send(result)
})

// update
app.patch("/books/:id",async(req,res)=>{
  const updateData = req.body;
  const {id} = req.params;
  const query = {_id: new ObjectId(id)};
  const result = await booksCollection.updateOne(query,{$set:updateData})
  res.send(result)
})

// Delete
app.delete("/books/:id", async(req,res)=>{
  const {id} = req.params;
  const query = {_id: new ObjectId(id)};
  const result = await booksCollection.deleteOne(query);
  res.send(result)
})

// http://localhost:8000/books
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})