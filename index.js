const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express());

app.get('/', (req,res) => {
    res.send('EMarket Hub server is ready');
});

app.get('/user', async (req,res) => {
    const user = [
        {name: 'Umayer Hossain ', age: 13 },
        {name: 'Rakib', age: 21}
    ]

    res.send(user[0])
})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_Pass}@cluster0.34gmw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();



    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`EMarket server running PORT:${port}`);
})