const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const jwt = require('jsonwebtoken');
const React = require("react");
const port = process.env.PORT || 8000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://672e4d4d364cc8e454fab0b6--spontaneous-meerkat-6f01c3.netlify.app"

    ],
    methods: ["GET", "POST", "PUT", "DELETE"], // Adjust methods as needed
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("EMarket Hub server is ready");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ipmfa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();


    // jwt api 
    app.post('/jwt', async(req,res) => {
       const user = req.body;
       
       const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'});
       res.send({token});
    });

    const verifyToken = (req,res,next) => {
      if(!req.headers.authorization){
        return res.status(401).send({message:'unauthorized access'});
      }
      
      const token = req.headers.authorization.split('Bearer')[1];
      jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, (err,decode) => {
        if(err){
          return res.status(401).send({message:'unauthorized access'});
        }

        req.decode = decode;
        next();
      })

      
    }

    const categoryCollection = client
      .db("eMarketHubDb")
      .collection("categories");
    const usersCollection = client.db("eMarketHubDb").collection("users");
    const bannerCollection = client.db("eMarketHubDb").collection("banners");
    const daleyCollection = client.db("eMarketHubDb").collection("daley");
    const productsCollection = client.db("eMarketHubDb").collection("products");
    const adsCollection = client.db("eMarketHubDb").collection("ads");
    const bottomBannerCollection = client
      .db("eMarketHubDb")
      .collection("buttom_banner");
      const cartsCollection = client.db("eMarketHubDb").collection("carts");

      // user related api
      app.post('/users', async (req,res) => {
        const user = req.body;
      })







    // get categories
    app.get("/categories", async (req, res) => {
      const result = await categoryCollection.find().toArray();
      res.send(result);
    });

    // get banners
    app.get("/banners", async (req, res) => {
      const result = await bannerCollection.find().toArray();
      res.send(result);
    });

    // get bottom banner
    app.get("/bottom-banner", async (req, res) => {
      const result = await bottomBannerCollection.find().toArray();
      res.send(result);
    });

    // get daley
    app.get("/daley", async (req, res) => {
      const result = await daleyCollection.find().toArray();
      res.send(result);
    });

    // get ads
    app.get("/ads", async (req, res) => {
      const result = await adsCollection.find().toArray();
      res.send(result);
    });

    // get products
    app.get("/products", async (req, res) => {
      const result = await productsCollection.find().toArray();
      res.send(result);
    });

    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(filter);
      res.send(result);
    });



    // add to cart related api 

    app.get('/cart', verifyToken, async(req,res) => {
      const email = req.query.email;
      const query = {user_email: email}
      const result = await cartsCollection.find(query).toArray();
      res.send(result);
    })



    app.post('/cart', async(req,res) => {
      const product = req.body;
      const result = await cartsCollection.insertOne(product);
      res.send(result);
    })

    // count all products
    app.get("/count-products", async (req, res) => {
      const result = await productsCollection.estimatedDocumentCount();
      res.send({ count: result });
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`EMarket server running PORT:${port}`);
});
