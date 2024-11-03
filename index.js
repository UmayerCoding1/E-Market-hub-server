const express = require("express");
const cors = require("cors");

const { MongoClient, ServerApiVersion } = require('mongodb');
require("dotenv").config();
const app = express();
const port = process.env.PORT || 8000;

app.use(cors());
app.use(express());

app.get("/", (req, res) => {
  res.send("EMarket Hub server is ready");
});


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_Pass}@cluster0.ipmfa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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

    const categoryCollection = client.db('eMarketHubDb').collection('categories');
    const bannerCollection = client.db('eMarketHubDb').collection('banners');


    // get categories 
    app.get('/categories', async(req,res) => {
      const result = await categoryCollection.find().toArray();
      res.send(result);
    });

    // get banners
    app.get('/banners', async(Req,res) => {
      const result = await bannerCollection.find().toArray();
      res.send(result);
    })

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
});
