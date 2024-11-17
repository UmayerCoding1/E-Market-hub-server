const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const jwt = require("jsonwebtoken");
const SSLCommerzPayment = require("sslcommerz-lts");
const React = require("react");
const port = process.env.PORT || 8000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      "https://spontaneous-meerkat-6f01c3.netlify.app",
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

// jwt api


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

    const store_id = process.env.STORE_ID;
    const store_passwd = process.env.STORE_PASS;
    const is_live = false; //true for live, false for sandbox

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
    const divisionsCollection = client
      .db("eMarketHubDb")
      .collection("divisions");
    const districtsCollection = client
      .db("eMarketHubDb")
      .collection("districts");
    const upazilasCollection = client.db("eMarketHubDb").collection("upazilas");
    const addressesCollection = client
      .db("eMarketHubDb")
      .collection("addresses");
    const orderCollection = client.db("eMarketHubDb").collection("orders");

    // user related api
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = {email: user.email};
      const existing = await usersCollection.findOne(query);
      if(existing){
        return res.send({message: 'user already exist'})
      }else{
        const result = await usersCollection.insertOne(user);
        res.send(result);
      }
      
    });

    // divisions ,districts, upazilas related api
    app.get("/divisions", async (req, res) => {
      const result = await divisionsCollection.find().toArray();
      res.send(result);
    });

    app.get("/districts", async (req, res) => {
      const { division } = req.query;
      const result = await districtsCollection
        .find({ division: division })
        .toArray();
      res.send(result);
    });

    app.get("/upazilas", async (req, res) => {
      const { city } = req.query;
      const result = await upazilasCollection
        .find({ district: city })
        .toArray();
      res.send(result);
    });
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
      const { productName = "", category, sort = "" } = req.query;

      const filter = {
        ...(productName && {
          product_name: { $regex: productName, $options: "i" },
        }),

        ...(category && {
          category: category,
        }),
      };

      const option = {
        sort: {
          price: sort === "ase" ? 1 : -1,
        },
      };

      const result = await productsCollection.find(filter, option).toArray();

      res.send(result);
    });

    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await productsCollection.findOne(filter);
      res.send(result);
    });

    // add to cart related api

    app.get("/cart", async (req, res) => {
      const user = req.query;
      const decodeEmail = req.decode;
      // console.log(decodeEmail);

      const query = { user_email: user?.email };
      const result = await cartsCollection.find(query).toArray();
      res.send(result);
    });

    app.post("/cart", async (req, res) => {
      const product = req.body;
      // const {product_name,user_email,quantity} = product;
      const existingItem = await cartsCollection.findOne({
        product_name: product?.product_name,
        user_email: product?.user_email,
      });

      if (existingItem) {
        await cartsCollection.updateOne(
          { _id: existingItem._id },
          { $set: { quantity: existingItem.quantity + product.quantity } }
        );
        console.log("update");
        res.send({ message: "card product is update" });
      } else {
        const result = await cartsCollection.insertOne(product);
        res.send(result);
        console.log("new");
      }
    });

    app.delete("/cart/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await cartsCollection.deleteOne(filter);
      res.send(result);
    });

    // address
    app.get("/addresses", async (req, res) => {
      const { email } = req.query;
      const result = await addressesCollection.findOne({ userEmail: email });
      res.send(result);
    });

    app.post("/addresses", async (req, res) => {
      const address = req.body;
      const existingAddress = await addressesCollection.findOne({
        userEmail: address.userEmail,
      });
      if (existingAddress) {
        console.log("address already exist");
        return res.send({ address: true });
      } else {
        const result = await addressesCollection.insertOne(address);
        res.send(result);
      }
    });

    // order related api
    app.get("/orderUI", async (req, res) => {
      const query = req.query;

      const filter = {
        ...(query?.email && {
          cus_email: query.email,
        }),
        ...(query?.status &&
          query?.status !== "" && {
            orderStatus: query.status,
          }),
      };

      const result = await orderCollection.find(filter).toArray();

      res.send(result);
    });

    app.post("/order", async (req, res) => {
      const orderInfo = req.body;
      // console.log(...orderInfo.cartId);
      const queryCart = {
        _id: { $in: orderInfo.cartId.map((id) => new ObjectId(id)) },
      };
      const queryProduct = {
        _id: { $in: orderInfo.productId.map((id) => new ObjectId(id)) },
      };

      const addedProduct = await cartsCollection.find(queryCart).toArray();
      const product = await productsCollection.find(queryProduct).toArray();

      const total = addedProduct.reduce(
        (total, product) =>
          total + (product.price - product.discountPrice) * product.quantity,
        0
      );
      const total_price = total + orderInfo.shippingFee - orderInfo.discountTk;
      const tran_id = new ObjectId().toString();

      const data = {
        total_amount: total_price,
        currency: "BDT",
        tran_id: tran_id, // use unique tran_id for each api call
        success_url: `http://localhost:8000/payment/success/${tran_id}`,
        fail_url: `http://localhost:8000/payment/fail/${tran_id}`,
        // success_url: `https://e-market-hub-server.onrender.com/payment/success/${tran_id}`,
        // fail_url: `https://e-market-hub-server.onrender.com/payment/fail/${tran_id}`,
        cancel_url: "http://localhost:3030/cancel",
        ipn_url: "http://localhost:3030/ipn",
        shipping_method: "Courier",
        product_name: "Computer.",
        product_category: "Electronic",
        product_profile: "general",
        cus_name: orderInfo.cus_name,
        cus_email: orderInfo.cus_email,
        cus_add1: orderInfo.cus_add,
        cus_add2: orderInfo.cus_add,
        cus_city: orderInfo.cus_city,
        cus_state: orderInfo.cus_state,
        cus_postcode: "***",
        cus_country: "Bangladesh",
        cus_phone: orderInfo.cus_number,
        cus_fax: "01711111111",
        ship_name: "Customer Name",
        ship_add1: "Dhaka",
        ship_add2: "Dhaka",
        ship_city: "Dhaka",
        ship_state: "Dhaka",
        ship_postcode: 1000,
        ship_country: "Bangladesh",
      };

      const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live);
      sslcz.init(data).then((apiResponse) => {
        // Redirect the user to payment gateway
        let GatewayPageURL = apiResponse.GatewayPageURL;
        res.send({ url: GatewayPageURL });

        const finalOrder = {
          paidStatus: false,
          tranjectionId: tran_id,
          cus_email: orderInfo.cus_email,
          orderDate: new Date(),
          orderStatus: "pending",
          totalAmount: total_price,
          item: addedProduct.map((item) => ({
            productId: item.product_id,
            quantity: item.quantity,
            totalPrice: (item.price - item.discountPrice) * item.quantity,
            product_image: item.image,
            product_name: item.product_name,
            orderDate: new Date(),
          })),
          shippingDetails: {
            address: [
              orderInfo.cus_add,
              orderInfo.cus_add,
              orderInfo.cus_state,
            ],
            contactNumber: orderInfo.cus_number,
          },
        };
        const result = orderCollection.insertOne(finalOrder);

        console.log("Redirecting to: ", GatewayPageURL);
      });

      app.post("/payment/success/:tranId", async (req, res) => {
        console.log(req.params.tranId);
        const result = await orderCollection.updateOne(
          { tranjectionId: req.params.tranId },
          {
            $set: {
              paidStatus: true,
            },
          }
        );
        const order = await orderCollection.findOne({
          tranjectionId: req.params.tranId,
        });
        const queryCartItem = {
          _id: {
            $in: addedProduct?.map((item) => new ObjectId(item._id)),
          },
        };

        if (result.matchedCount > 0) {
          const addedProductDelete = await cartsCollection.deleteMany(
            queryCartItem
          );
         
          // update2
          res.redirect("http://localhost:5173/my-order");
        }
      });

      app.post("/payment/fail/:tranId", async (req, res) => {
        const result = await orderCollection.deleteOne({
          tranjectionId: req.params.tranId,
        });
        // update1
        if (result.deletedCount) {
          res.redirect("http://localhost:5173/my-account");
        }
      });
    });

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
