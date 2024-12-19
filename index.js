const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const cors = require("cors");
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken');

require("dotenv").config();

//adding middle ware
app.use(
  cors({
    origin: 'http://localhost:5173', // Your frontend URL
    credentials: true, // Allows cookies to be sent
  })
);

app.use(express.json());
app.use(cookieParser())





//custom middelware

// const logger =async(req,res,next)=>{

//   console.log('called',req.host,req.originalUrl)
//   next();

// }



const verifyToken = (req, res, next) => {


  const token = req.cookies?.token;
  console.log('Token received in middleware:', token);

  if (!token) {
    return res.status(401).send({ message: 'Not authorized' });
  }

  // Verify the token
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.error('Error verifying token:', err.message);
      return res.status(410).send({ message: 'Unauthorized shafik' });
    }

    console.log('Decoded token:', decoded);
    req.user = decoded; // Optionally attach the decoded token to the request object
    next(); // Proceed to the next middleware
  });
};






//adding mongodb
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// Replace the placeholder with your Atlas connection string
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.o9sii.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const DB = client.db("DoctorCar");

const MyColl = DB.collection("ProductInfo");
const MyOrder = DB.collection("orders");
async function run() {
  try {
    // Connect the client to the server (optional starting in v4.7)
    await client.connect();

   

    //generateing jwt token
    app.post('/jwt',async(req,res)=>{
      const data=req.body.email
     const token= jwt.sign({email:data}, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '24h' });    
 
     
  
      res
      .cookie('token',token,{
        origin:'http://localhost:5173',
        httpOnly:true,
        secure:false,
        sameSite:'lax',
        
        maxAge: 60 * 60 * 1000,

      })
      .send({success:true})

      console.log(data)
    })

    


    app.post(`/delete/:id`, async (req, res) => {
      const id = req.params.id;
      const doc = { _id: new ObjectId(id) };
      const deleteResult = await MyOrder.deleteOne(doc);
      res.send(deleteResult);
    });

    app.get("/services", async (req, res) => {
      const result = await MyColl.find({}).toArray();
      res.send(result);
    });
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const projection = { _id: 1, title: 1, price: 1, img: 1 }; // Include only these fields

      const find = await MyColl.findOne(query, { projection });
      res.send(find);
    });

    app.post("/checkout", async (req, res) => {
      try {
        const data = req.body; // Get data from the request body
        const result = await MyOrder.insertOne(data); // Insert data into the database
        console.log(result);

        // Check if the insert was successful
        if (result.acknowledged) {
          res
            .status(200)
            .json({
              success: true,
              message: "Data successfully added to the database.",
            });
        } else {
          res
            .status(500)
            .json({ success: false, message: "Data insertion failed." });
        }
      } catch (error) {
        console.error("Error inserting data:", error);
        res
          .status(500)
          .json({
            success: false,
            message: "An error occurred.",
            error: error.message,
          });
      }
    });






    app.get("/bookings",verifyToken, async (req, res) => {

      const email = req.query.email;
      
      // Construct the query object based on the presence of the email parameter
      const query = email ? { email: email } : {};
      console.log('chicking cookies of booking',req.cookies.token)
      
      const bookings = await MyOrder.find(query).sort({ email: 1 }).toArray();
      res.send(bookings)
      // console.log(bookings)
     
   
    });


    //adding logout and clearing cookies;
    app.post('/logout', (req, res) => {
      // Clear the JWT cookie when the user logs out
      res.clearCookie('token', {
        path: '/',
        secure: false, // Set to true if you're using HTTPS
        httpOnly: true, // Prevents client-side JavaScript from accessing the cookie
        sameSite: 'lax', // If cross-origin
      });
    
      res.status(200).send({ success: true, message: 'Logged out successfully' });
    });
    






  } catch (error) {
    console.error("Error during setup:", error);
  }
}
run().catch(console.dir);

//adding path

app.get("/", (req, res) => {
  res.send("doctor api is running");
});
app.get("/test", (req, res) => {
  res.send("testing the doctor api");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
