const express = require('express');
const app = express()
const cors = require('cors')
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000;


// middle   ware 
app.use(cors())
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_user}:${process.env.DB_pass}@cluster0.rjjtc94.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
        // await client.connect();
        const usersCollection = client.db('MFS').collection('users')
        // bcript function 
        async function hashPass(password) {
            const res = await bcryptjs.hash(password, 10);
            return res;
        }
        async function comparePass(userPass, hashPass) {
            const res = await bcryptjs.compare(userPass, hashPass);
            return res;
        }

        // get api
        app.get('/roll/:email', async (req, res) => {
            const email = req.params.email;
            // console.log(email)
            const query = { email: email }
            const result = await usersCollection.findOne(query)
            const roll = result.roll;
            console.log(roll)
            res.send({ roll })
        })


        // post api 
        app.post('/users', async (req, res) => {
            const user = req.body;
            // console.log(user)
            const token = jwt.sign({ name: user.name, mobile: user.mobile, email: user.email }, '30a4e290308bdd5579c3d4f726a7585e2525d03a948b9aad9fe7b5e8091967ba87229bc7b3dec101a193f3bc092207b7598938244da57d024ae3eee6a87047ea', { expiresIn: '1h' })
            const data = {
                name: user.name,
                pin: await hashPass(user.pin),
                mobile: user.mobile,
                email: user.email,
                roll: user.roll,
                status: user.status,
                token: token
            }


            const result = await usersCollection.insertOne(data);
            res.send({ result, token })
        })

        app.post('/login', async (req, res) => {
            const user = req.body;
            console.log(user)
            const query = { $or: [{ mobile: user.mobEmail }, { email: user.mobEmail }] }
            const result = await usersCollection.findOne(query)

            if (!result) {
                return res.send({ message: 'credential wrong' })
            }

            const check = comparePass(user.pin, result.pin)
            if (!check) {
                return res.send({ message: 'forbidden access' })
            }
            res.send({ message: 'success', token: result.token, user:result })

        })



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('mfs job task is running')
})
app.listen(port, () => {
    console.log(`Running the port is ${port}`)
})