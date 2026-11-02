import express from "express";
import cors from "cors"
import "dotenv/config"

const app = express();
const port = process.env.port || 8000;

// Middleware
app.use(cors());
app.use(express.json());




app.get('/', (req, res) => {
  res.send('Home Route')
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})