import express from "express";
import cors from "cors"
import "dotenv/config"
import { MongoClient, ObjectId } from "mongodb";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const port = process.env.port || 8000;

// Middleware
app.use(cors());
app.use(express.json());

//Verify API
const verifyToken = async (req,res,next)=>{
  // get data from header
  const authHeader = req.headers.authorization
  // check if header is present
  if(!authHeader ){
    return res.status(401).send({message: "Unauthorized access"})
  }
  // get token from header
  const token = authHeader.split(" ")[1]
  // check if token is present
  if(!token ){
    return res.status(401).send({message: "Unauthorized access"})
  }
  // verify token
  const JWKS =  createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));
  try {
    const {payload} = await jwtVerify(token,JWKS)
    next();
  }catch(err){
    return res.status(500).send({message: "Internal Server Error", error: err.message})
  }
}

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
  const result = await booksCollection.find({}).sort({createdAt: -1} ).toArray()
  res.send(result)
})

// get specific item
app.get("/books/:id",verifyToken,async(req,res)=>{
  const {id} = req.params;
  const query = {_id: new ObjectId(id)};
  const result = await booksCollection.findOne(query);
  res.send(result);
})

// get specific item by email
app.get("/my-books/:email",verifyToken,async(req,res)=>{
  const {email} = req.params;
  const query = {userEmail: email};
  const result = await booksCollection.find(query).toArray();
  res.send(result);
})

//post books
app.post("/books",verifyToken,async (req,res)=>{
  const bookData = req.body;
  const result = await booksCollection.insertOne(bookData)
  console.log(result);
  res.send(result)
})

// update
app.patch("/books/:id",verifyToken,async(req,res)=>{
  const updateData = req.body;
  const {id} = req.params;
  const query = {_id: new ObjectId(id)};
  const result = await booksCollection.updateOne(query,{$set:updateData})
  res.send(result)
})

// Delete
app.delete("/books/:id", verifyToken ,async(req,res)=>{
  const {id} = req.params;
  const query = {_id: new ObjectId(id)};
  const result = await booksCollection.deleteOne(query);
  res.send(result)
})

//Borrow Collection
app.post("/borrows",verifyToken,async(req,res)=>{
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
app.get("/my-borrows/:email",verifyToken,async(req,res)=>{
  const {email} = req.params;
  const query = {userEmail: email};
  const result = await borrowCollection.find(query).toArray();
  res.send(result);
})
// Delete
app.delete("/borrows/:bookId",verifyToken,async(req,res)=>{
  const {bookId} = req.params;
  const query = {bookId: bookId};
  const bookQuery = {_id: new ObjectId(bookId)};

  const book = await booksCollection.findOne(bookQuery);
  if (!book) {
    return res.status(404).send({
      message: "Book not found"
    });
  }

  const result = await borrowCollection.deleteOne(query);
  if (result.deletedCount === 0) {
    return res.status(404).send({
      message: "Borrow record not found"
    });
  }

  await booksCollection.updateOne(
    bookQuery,
    {
      $inc: { totalCopy: 1 }
    }
  );
  res.send(result)
})
// http://localhost:8000/books
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})