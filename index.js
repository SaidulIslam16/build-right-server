const express = require('express');
const cors = require('cors');
require('dotenv').config()
const stripe = require("stripe")(process.env.Payment_Key);

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
const app = express();

// middlewares
app.use(cors());
app.use(express.json());

// ========== MongoDB ================


const uri = `mongodb+srv://${process.env.DB_User}:${process.env.DB_PASS}@cluster0.hla3ttg.mongodb.net/?retryWrites=true&w=majority`;

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

        // Collections of DB
        const coursesCollection = client.db("buildRight").collection("courses");
        const usersCollection = client.db("buildRight").collection("users");
        const cartCollection = client.db("buildRight").collection("cart");
        const paymentCollection = client.db("buildRight").collection("payments");

        app.get('/classes', async (req, res) => {
            const restult = await coursesCollection.find().toArray();
            res.send(restult);
        })

        // user related apis
        app.post('/users', async (req, res) => {
            const user = req.body;

            const query = { email: user.email };
            const existingemail = await usersCollection.findOne(query);
            if (existingemail) {
                return res.send("User already Exist");
            }
            else {
                const result = await usersCollection.insertOne(user);
                res.send(result);
            }
        })

        // cart related APIs
        app.post('/cart', async (req, res) => {
            const classInfo = req.body;

            const query = { courseId: classInfo.courseId };
            const existingCourse = await cartCollection.findOne(query);
            if (existingCourse) {
                return res.send('Course Already Added');
            }
            else {
                const result = await cartCollection.insertOne(classInfo);
                res.send(result);
            }
        })

        app.get('/cart', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await cartCollection.find(query).toArray();
            res.send(result);
        })

        app.delete('/cart/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(filter);
            res.send(result);
        })

        // Payment Intent

        app.post('/paymentIntent', async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            // console.log(amount);

            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: "usd",
                payment_method_types: ["card"],
                // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
                // automatic_payment_methods: {
                //     enabled: true,
                // },
            });

            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })

        // payment related API calls
        app.post('/payments', async (req, res) => {
            const { payment } = req.body;
            const result = await paymentCollection.insertOne(payment);
            const query = { _id: new ObjectId(payment.productId) };
            const deleteResult = await cartCollection.deleteOne(query);
            res.send({ result, deleteResult });
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



app.get('/', (req, res) => {
    res.send('Build-Right Server is Running');
});

app.listen(port, () => {
    console.log('Server running at port', port);
});