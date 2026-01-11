// Import required packages
require('dotenv').config();
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb'); 
const cors = require('cors');
const bcrypt = require('bcryptjs');

// Get the MongoDB connection string
const dbUrl = process.env.DATABASE_URL;

// Create the Express app
const app = express();
const port = process.env.PORT || 3000; // Use Render's port if available
const client = new MongoClient(dbUrl);

// Global DB variable to reuse the connection
let db;

// === MIDDLEWARE ===
app.use(cors()); // Allows your frontend to talk to this backend
app.use(express.json());

// --- PRODUCTS DATA (For Seeding) ---
// Kept your original product list here
const products = [
    { id: 1, name: "Apple Watch Series 7 45mm", price: 349.00, image: "images/apple-watch-series7-45-midnight.jpg", rating: "⭐⭐⭐⭐⭐ (128 reviews)", condition: "Like New", badge: "Bestseller", category: "wearables" },
    { id: 2, name: "Bose QC45 White", price: 279.00, image: "images/bose-qc45-white.jpg", rating: "⭐⭐⭐⭐⭐ (94 reviews)", condition: "Excellent", badge: "Popular", category: "audio" },
    { id: 3, name: "Dell XPS 13 16GB RAM 512GB SSD", price: 849.00, image: "images/dell-xps13-16-512-silver.jpg", rating: "⭐⭐⭐⭐⭐ (156 reviews)", condition: "Like New", badge: "Top Pick", category: "laptops" },
    { id: 4, name: "Samsung Galaxy S21 256GB", price: 399.00, image: "images/galaxy-s21-256-gray.jpg", rating: "⭐⭐⭐⭐⭐ (203 reviews)", condition: "Excellent", badge: "In Stock", category: "phones" },
    { id: 5, name: "HP Spectre 360 16GB RAM", price: 1099.00, image: "images/hp-spectre-x360-16-512-nightfall.jpg", rating: "⭐⭐⭐⭐⭐ (87 reviews)", condition: "Like New", badge: "Premium", category: "laptops" },
    { id: 6, name: "iPad Pro 11 Inch Silver", price: 749.00, image: "images/ipad-pro-11-128-silver.jpg", rating: "⭐⭐⭐⭐⭐ (142 reviews)", condition: "Excellent", badge: "Hot Deal", category: "tablets" },
    { id: 7, name: "iPhone 13 128GB Blue Unlocked", price: 499.00, image: "images/iphone13-128-blue.jpg", rating: "⭐⭐⭐⭐⭐ (267 reviews)", condition: "Like New", badge: "Best Seller", category: "phones" },
    { id: 8, name: "MacBook Air M1 256GB Space Gray", price: 799.00, image: "images/macbook-air-m1-256-spacegray.jpg", rating: "⭐⭐⭐⭐⭐ (198 reviews)", condition: "Excellent", badge: "Top Pick", category: "laptops" },
    { id: 9, name: "Google Pixel 6 128GB Unlocked", price: 329.00, image: "images/pixel6-128-black.jpg", rating: "⭐⭐⭐⭐⭐ (111 reviews)", condition: "Like New", badge: "Great Value", category: "phones" },
    { id: 10, name: "Sony WH1000XM4 Headphones", price: 249.00, image: "images/sony-wh1000xm4-black.jpg", rating: "⭐⭐⭐⭐⭐ (189 reviews)", condition: "Excellent", badge: "Popular", category: "audio" },
    { id: 11, name: "Lenovo ThinkPad X1 Carbon Gen 9", price: 949.99, image: "images/lenovo-thinkpad-x1-carbon.jpg", rating: "⭐⭐⭐⭐⭐ (76 reviews)", condition: "Like New", badge: "Premium", category: "laptops" },
    { id: 12, name: "Microsoft Surface Pro 8", price: 899.00, image: "images/surface-pro8-8-256-platinum.jpg", rating: "⭐⭐⭐⭐⭐ (134 reviews)", condition: "Excellent", badge: "Top Pick", category: "tablets", specs: "Intel Core i7, 256GB SSD, 8GB RAM, Windows 11" }
];

// === ★ PROFESSIONAL DB CONNECTION ★ ===
// We connect ONCE when the server starts, not every request.
async function startServer() {
    try {
        await client.connect();
        db = client.db("Cluster0");
        console.log("✅ Successfully connected to MongoDB");

        app.listen(port, () => {
            console.log(`🚀 Server is listening on port ${port}`);
        });
    } catch (error) {
        console.error("❌ Failed to connect to MongoDB:", error);
        process.exit(1); // Stop the app if DB fails
    }
}
startServer();


// === ORDER ROUTES ===

// 1. Save a new order
app.post('/api/orders', async (req, res) => {
    try {
        const orderData = req.body;
        if (!orderData.userId || !orderData.cart) {
            return res.status(400).json({ message: 'Invalid order data' });
        }
        
        // Use the global 'db' variable - much faster!
        const result = await db.collection("orders").insertOne(orderData);
        res.status(201).json({ message: 'Order placed successfully', orderId: result.insertedId });
    } catch (error) {
        console.error("Failed to save order:", error);
        res.status(500).send('Error saving order');
    }
});

// 2. Get orders for a specific user
app.get('/api/orders', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId) return res.status(400).json({ message: 'User ID required' });

        const userOrders = await db.collection("orders").find({ userId: userId }).toArray();
        res.status(200).json(userOrders);
    } catch (error) {
        res.status(500).send('Error fetching orders');
    }
});


// === USER AUTH ROUTES ===
app.post('/api/users/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const usersCollection = db.collection("users");
        const existingUser = await usersCollection.findOne({ email: email });
        
        if (existingUser) return res.status(409).json({ message: 'User already exists.' });

        const newUser = { email: email, password: hashedPassword, createdAt: new Date() };
        await usersCollection.insertOne(newUser);

        res.status(201).json({ message: 'User registered successfully!' });
    } catch (error) {
        res.status(500).send('Error registering user');
    }
});

app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

        const user = await db.collection("users").findOne({ email: email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials.' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials.' });

        res.status(200).json({
            message: 'Login successful',
            user: { id: user._id, email: user.email }
        });
    } catch (error) {
        res.status(500).send('Error logging in');
    }
});

// === PRODUCT ROUTES ===
app.get('/api/products', async (req, res) => {
    try {
        const allProducts = await db.collection("products").find({}).toArray();
        res.status(200).json(allProducts);
    } catch (error) {
        console.error("Product fetch error:", error);
        res.status(500).send('Error fetching products');
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) return res.status(400).send('Invalid ID');

        const product = await db.collection("products").findOne({ id: productId });

        if (product) res.status(200).json(product);
        else res.status(404).send('Product not found');
    } catch (error) {
        res.status(500).send('Error fetching product');
    }
});

// Seed Route (Use cautiously in production!)
app.get('/seed', async (req, res) => {
    try {
        const productsCollection = db.collection("products");
        await productsCollection.deleteMany({});
        const result = await productsCollection.insertMany(products);
        res.status(201).send(`Seeded ${result.insertedCount} products!`);
    } catch (error) {
        res.status(500).send('Error seeding database');
    }
});

app.get('/', (req, res) => res.send('Backend is running and DB is connected!'));
