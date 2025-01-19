import express from "express";
import cors from "cors";
import { MongoClient, ServerApiVersion, ObjectId } from "mongodb";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import SSLCommerzPayment from "sslcommerz-lts";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

dotenv.config();
const app = express();
const port = process.env.PORT || 8000;

app.use(
  cors({
    origin: [
      "https://emarket-hub.web.app",
      "http://localhost:5173"
    ]
  })
);
app.use(express.json());
// app.use(helmet({
//   frameguard: false,
// }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;

    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file upload successfully
    console.log("File upload successfully", response.url);
    return response;
  } catch (error) {
    // remove the locally save temporary file as the upload operation got the failed
    console.log(error);

    fs.unlinkSync(localFilePath);
    return null;
  }
};
// upload multiple file in Cloudinary
const uploadMultipleFilesOnCloudinary = async (filePaths) => {
  if(!filePaths){
    return console.log('file path is not find', filePaths);
    
  }
  const uploadPromises = filePaths.map((filePath) =>
    uploadOnCloudinary(filePath)
  );
  const results = await Promise.all(uploadPromises);
  return results.filter((result) => result !== null);
};
app.get("/", (req, res) => {
  res.send("EMarket Hub server is ready");
});

// jwt api
app.post("/jwt", (req, res) => {
  const { email } = req.body;
  const user = { email };
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });
  res.send({ token });
});

// verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send({ message: '"unauthorized  access' });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decode) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.decode = decode;
    next();
  });
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/upload");
  },

  filename: (req, file, cb) => {
    cb(null, `eMarketHub-${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ipmfa.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// const uri = "mongodb://localhost:27017/"

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
    const myListCollection = client.db("eMarketHubDb").collection("my_list");

    // image upload
    app.post(
      "/api/image/uploads",
      upload.array("productImage",2),
      async (req, res) => {
        console.log(req.files);
        if(!req.files){
          return res.status(500).send({message: "File is not found"})
        }
        
        
        const filePaths = req.files?.map((file) => file.path);
        const uploadedFile = await uploadMultipleFilesOnCloudinary(filePaths);
        res.send({ url: uploadedFile });
      }
    );

    app.post("/api/image/upload", upload.single("images"), async (req, res) => {
      const response = await uploadOnCloudinary(req.file.path);
      res.send({ url: response.url });
    });

    // user related api
    app.post("/users", async (req, res) => {
      const user = req.body;
      const query = { email: user.email };
      const existing = await usersCollection.findOne(query);
      if (existing) {
        return res.send({ message: "user already exist" });
      } else {
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
      const query = req.query;
      const filter = {
        ...(query.division && {
          division: query?.division,
        }),
      };
      const result = await districtsCollection.find(filter).toArray();
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

    app.post("/categories", async (req, res) => {
      const category = req.body;
      const result = await categoryCollection.insertOne(category);
      res.send(result);
    });

    app.delete("/categories/:id", async (req, res) => {
      const id = req.params.id;
      const result = await categoryCollection.deleteOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    // get banners
    app.get("/banners", async (req, res) => {
      const result = await bannerCollection.find().toArray();
      res.send(result);
    });

    app.post("/banner", async (req, res) => {
      const banner = req.body;
      const result = await bannerCollection.insertOne(banner);
      res.send(result);
    });

    app.delete("/banner/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await bannerCollection.deleteOne(filter);
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

    app.post('/daley', async (req,res) => {
      const daleyData = req.body;
      const daleyCount = await daleyCollection.estimatedDocumentCount();
      if(daleyCount >= 2){
        return res.send({message: '2 daley already add. Added by only 2 daley please try to next time'})
      }
      const result = await daleyCollection.insertOne(daleyData);
      res.send(result)
         
    })

    // get ads
    app.get("/ads", async (req, res) => {
      const result = await adsCollection.find().toArray();
      res.send(result);
    });

    // get products
    app.get("/products", async (req, res) => {
      const { productName = "", category, sort = "", subCategory } = req.query;

      const filter = {
        ...(productName && {
          product_name: { $regex: productName, $options: "i" },
        }),

        ...(category && {
          category: category,
        }),

        ...(subCategory && {
          subCategory: subCategory,
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
      const result = await productsCollection.findOne({
        _id: new ObjectId(id),
      });
      res.send(result);
    });

    app.post("/product", async (req, res) => {
      const product = req.body;
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

   

    app.put("/product/:id", async (req, res) => {
      const id = req.params.id;
      const {
        product_name,
        description,
        price,
        discount,
        product_RAM,
        size,
        stock,
      } = req.body;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          product_name: product_name,
          description: description,
          price: price,
          discount: discount,
          product_RAM: product_RAM,
          stock: stock,
          size: size,
        },
      };

      const result = await productsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)};
      const result = await productsCollection.deleteOne(query);
      res.send(result);
    });

    // add to cart related api

    app.get("/cart", verifyToken, async (req, res) => {
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

    app.put("/update/cartQuantity/:id", verifyToken, async (req, res) => {
      const { updatedQuantity } = req.body;
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          quantity: updatedQuantity,
        },
      };
      const result = await cartsCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    // address
    app.get("/addresses", verifyToken, async (req, res) => {
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

    // my list related api
    app.get("/my-list", verifyToken, async (req, res) => {
      const { email } = req.query;
      const result = await myListCollection.find({ email: email }).toArray();
      res.send(result);
    });

    app.post("/my-list", async (req, res) => {
      const { id, email } = req.body;

      const product = await productsCollection.findOne({
        _id: new ObjectId(id),
      });
      const listItem = { product, email };
      const result = await myListCollection.insertOne(listItem);
      res.send(result);
    });

    app.delete("/my-list/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: new ObjectId(id) };
      const result = await myListCollection.deleteOne(query);
      res.send(result);
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
        ...(query?.sortPendingOrder && {
          tranjectionId: query?.sortPendingOrder,
        }),
      };

      const result = await orderCollection.find(filter).toArray();
      res.send(result);
    });

    app.get("/confirmOrder", async (req, res) => {
      const query = req.query;
      const find = { orderStatus: "confirm" };
      const existConfirmOrder = await orderCollection.find(find).toArray();
      const result = existConfirmOrder.filter((order) =>
        query.sortConfirmOrder
          ? order.tranjectionId === query.sortConfirmOrder
          : order
      );
      res.send(result);
    });

    app.get("/deliveredOrder", async (req, res) => {
      const query = req.query;
      const find = { orderStatus: "delivered" };
      const existDeliveryOrder = await orderCollection.find(find).toArray();
      const result = existDeliveryOrder.filter((order) =>
        query.sortDeliveredOrder
          ? order.tranjectionId === query.sortDeliveredOrder
          : order
      );
      res.send(result);
    });

    // update order status
    app.put("/order/:id", async (req, res) => {
      const id = req.params.id;
      const { updatedStatus,productDetails } = req.body;
     const productId = productDetails?.flatMap((order) => order.productId);
     const productQut = productDetails?.flatMap((order) => order.quantity);
      const filter = { _id: new ObjectId(id) };
      const filterProduct = productDetails?.map((order) => ({
        _id: new ObjectId(order.productId),
        quantity : order.quantity
      }))
      const updatedDoc = {
        $set: {
          orderStatus: updatedStatus,
        },
      };
       
      const updateProductStock = await Promise.all(
        filterProduct.map( async (product) => {
          const existingProduct = await productsCollection.findOne({_id: product._id});
          const currentStock = parseInt(existingProduct.stock)


          return{
            updateOne: {
              filter: {_id: product._id},
              update: {$set: {stock: currentStock - product.quantity}}
            }
          }
        }));

        const productUpdate = await productsCollection.bulkWrite(updateProductStock);

      
      
      const result = await orderCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });

    app.post("/order", async (req, res) => {
      const orderInfo = req.body;
      // console.log(...orderInfo.cartId);
      const queryCart = {
        _id: { $in: orderInfo.cartId.map((id) => new ObjectId(id)) },
      };

      const addedProduct = await cartsCollection.find(queryCart).toArray();

      const user = await usersCollection.findOne({
        email: orderInfo.cus_email,
      });

      const total = addedProduct.reduce(
        (total, product) =>
          total + (product.price - product.discountPrice) * product.quantity,
        0
      );
      const total_price = total + orderInfo.shippingFee - orderInfo.discountTk;
      const tran_id = new ObjectId().toString();

      const data = {
        total_amount: parseInt(total_price),
        currency: "BDT",
        tran_id: tran_id, // use unique tran_id for each api call
        // success_url: `http://localhost:8000/payment/success/${tran_id}`,
        // fail_url: `http://localhost:8000/payment/fail/${tran_id}`,
        success_url: `https://e-market-hub-server.onrender.com/payment/success/${tran_id}`,
        fail_url: `https://e-market-hub-server.onrender.com/payment/fail/${tran_id}`,
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
          userId: user._id,
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

        console.log(result);

        if (result.matchedCount > 0) {
          const addedProductDelete = await cartsCollection.deleteMany(
            queryCartItem
          );

          // update2
          res.redirect("https://emarket-hub.web.app/my-order");
        }
      });

      app.post("/payment/fail/:tranId", async (req, res) => {
        const result = await orderCollection.deleteOne({
          tranjectionId: req.params.tranId,
        });
        // update1
        if (result.deletedCount) {
          res.redirect("https://emarket-hub.web.app/my-account");
        }
      });
    });

    // count all products
    app.get("/count-products", async (req, res) => {
      const result = await productsCollection.estimatedDocumentCount();
      res.send({ count: result });
    });

    app.get('/count-all',async(req,res) => {
      const productsResult = await productsCollection.estimatedDocumentCount();
      const ordersResult = await orderCollection.estimatedDocumentCount();
      const usersResult = await usersCollection.estimatedDocumentCount();
      const order = await orderCollection.find().toArray();
      const totalRevenue = order.reduce((totalRevenue, order) => order.totalAmount + totalRevenue,0);
      
      res
      .status(200)
      .json({
        products: productsResult,
        orders: ordersResult,
        users: usersResult,
        revenue: totalRevenue,
      })
    })

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
  console.log(`EMarket server running PORT:${port}${uri}`);
});
