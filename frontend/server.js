require('dotenv').config(); // Load .env from the current directory (frontend)
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();
const port = process.env.SERVER_PORT || 3001;

// Enable CORS for all routes with a more permissive configuration
app.use(cors({
    origin: true, // Allow all origins
    credentials: true
}));

app.use(express.json());

// Ensure your password is URL-safe by encoding it
const API_BASE_URL = 'http://localhost:8000';
const ROBOTS_ENDPOINT = `${API_BASE_URL}/robot/get_robots`;

// MongoDB Client Setup
const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
    console.error("Error: MONGODB_URI is not defined in the environment variables.");
    process.exit(1);
}
const client = new MongoClient(mongoUri);

// Connect to MongoDB
async function connectToMongo() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");

        const database = client.db(process.env.MONGODB_DATABASE);
        const collection = database.collection(process.env.MONGODB_COLLECTION);
        const count = await collection.countDocuments();
        console.log(`Found ${count} documents in collection`);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}

// API Routes
app.get('/api/security-bot-data', async (req, res) => {
    console.log('Received request for security bot data'); // Debug log
    try {
        const database = client.db(process.env.MONGODB_DATABASE);
        const collection = database.collection(process.env.MONGODB_COLLECTION);
        const data = await collection
            .find({})
            .sort({ script_timestamp: 1 })
            .toArray();
        console.log("Fetched data count:", data.length); // Debug log
        res.json(data);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/simulation/data', async (req, res) => {
    try {
        const db = client.db(process.env.MONGODB_DATABASE);
        const collection = db.collection(process.env.MONGODB_COLLECTION);
        console.log('Attempting to fetch data from collection: security_bot_data');

        const data = await collection.findOne({}, { sort: { script_timestamp: -1 } });
        console.log('Retrieved data from MongoDB:', data);

        if (!data) {
            console.log('No data found in collection');
            return res.status(404).json({ error: 'No simulation data found' });
        }

        res.json({
            simulation_timestamp: data.script_timestamp,
            location: {
                x: data.location?.x || 0,
                y: data.location?.y || 0,
                z: data.location?.z || 0
            },
            velocity: {
                speed_kmh: data.velocity?.speed || 0,
                x: data.velocity?.x || 0,
                y: data.velocity?.y || 0
            },
            control: {
                throttle: data.control?.throttle || 0,
                steer: data.control?.steering || 0,
                brake: data.control?.brake || 0
            },
            rotation: {
                pitch: data.rotation?.pitch || 0,
                yaw: data.rotation?.yaw || 0,
                roll: data.rotation?.roll || 0
            }
        });
    } catch (error) {
        console.error('Error fetching simulation data:', error);
        res.status(500).json({ error: 'Failed to fetch simulation data' });
    }
});

app.get('/api/simulation/history', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const db = client.db(process.env.MONGODB_DATABASE);
        const collection = db.collection(process.env.MONGODB_COLLECTION);

        const data = await collection
            .find()
            .sort({ script_timestamp: -1 })
            .limit(limit)
            .toArray();
        res.json(data);
    } catch (error) {
        console.error('Error fetching simulation history:', error);
        res.status(500).json({ error: 'Failed to fetch simulation history' });
    }
});

app.get('/api/simulation/range', async (req, res) => {
    try {
        const { start, end } = req.query;
        const db = client.db(process.env.MONGODB_DATABASE);
        const collection = db.collection(process.env.MONGODB_COLLECTION);

        const data = await collection
            .find({
                script_timestamp: {
                    $gte: new Date(start),
                    $lte: new Date(end)
                }
            })
            .sort({ script_timestamp: 1 })
            .toArray();
        res.json(data);
    } catch (error) {
        console.error('Error fetching data by time range:', error);
        res.status(500).json({ error: 'Failed to fetch data by time range' });
    }
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something broke!' });
});

// Start server
connectToMongo().then(() => {
    app.listen(port, '0.0.0.0', () => {
        console.log(`Server running on port ${port}`);
    });
});