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
const borrowCollection = db.collection("borrows")


app.get('/', (req, res) => {
  res.send({message: "Server is running"})
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

//Borrow Collection
app.post("/borrows",async(req,res)=>{
  const data = req.body;
  const alreadyBorrowed = await borrowCollection.findOne({
    bookId: data.bookId,
    userEmail: data.userEmail
  });
  if (alreadyBorrowed) {
      return res.status(400).send({
        message: "You have already borrowed this book"
      });
  }
  //  Find the book
  const book = await booksCollection.findOne({
    _id: new ObjectId(data.bookId)
  });

  // Check available copies
  if (book.totalCopy <= 0) {
    return res.status(400).send({
      message: "No copies available"
    });
  }

  //  Update available copies
  await booksCollection.updateOne(
    {
      _id: new ObjectId(data.bookId)
    },
    {
      $inc: { totalCopy: -1 }
    }
  );

  // 1. Current date
    const borrowDate = new Date();

    // 2. Calculate return date (7 days later)
    const returnDate = new Date(borrowDate);
    returnDate.setDate(borrowDate.getDate() + 7);
    const borrowData = {
      ...data,
      borrowDate: borrowDate.toLocaleDateString("en-CA"),
      returnDate: returnDate.toLocaleDateString("en-CA")
    }
    const result = await borrowCollection.insertOne(borrowData);
    res.send(result)
})
// specific data
app.get("/my-borrows/:email",async(req,res)=>{
  const {email} = req.params;
  const query = {userEmail: email};
  const result = await borrowCollection.find(query).toArray();
  res.send(result);
})
// http://localhost:8000/books
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})