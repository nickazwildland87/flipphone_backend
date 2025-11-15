// Import required packages
require('dotenv').config(); // Loads secret keys from .env file
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors'); // ★ THIS IS THE FIX ★

// Get the MongoDB connection string from our .env file
const dbUrl = process.env.DATABASE_URL;

// Create the Express app
const app = express();
const port = 3000; // The port our server will run on
const client = new MongoClient(dbUrl);

// === ★ THIS LINE ENABLES CORS ★ ===
// This allows your flipphoneresaleaz.com front-end to make requests
app.use(cors()); 

// === YOUR 12 PRODUCTS ===
// (This is just here for the /seed route)
const products = [
    { id: 1, name: "Apple Watch Series 7 45 inch", price: 349.00, image: "images/apple-watch-series7-45-midnight.jpg", rating: "⭐⭐⭐⭐⭐ (128 reviews)", condition: "Like New", badge: "Bestseller", category: "wearables" },
    { id: 2, name: "Bose QC45 White", price: 279.00, image: "images/bose-qc45-white.jpg", rating: "⭐⭐⭐⭐⭐ (94 reviews)", condition: "Excellent", badge: "Popular", category: "audio" },
    { id: 3, name: "Dell XPS 13 16GB RAM 512GB SSD Silver", price: 849.00, image: "images/dell-xps13-16-512-silver.jpg", rating: "⭐⭐⭐⭐⭐ (156 reviews)", condition: "Like New", badge: "Top Pick", category: "laptops" },
    { id: 4, name: "Samsung Galaxy S21 256GB", price: 399.00, image: "images/galaxy-s21-256-gray.jpg", rating: "⭐⭐⭐⭐⭐ (203 reviews)", condition: "Excellent", badge: "In Stock", category: "phones" },
    { id: 5, name: "HP Spectre 360 16GB RAM 512GB SSD", price: 1099.00, image: "images/hp-spectre-x360-16-512-nightfall.jpg", rating: "⭐⭐⭐⭐⭐ (87 reviews)", condition: "Like New", badge: "Premium", category: "laptops" },
    { id: 6, name: "iPad Pro 11 Inch Silver", price: 749.00, image: "images/ipad-pro-11-128-silver.jpg", rating: "⭐⭐⭐⭐⭐ (142 reviews)", condition: "Excellent", badge: "Hot Deal", category: "tablets" },
    { id: 7, name: "iPhone 13 128GB Blue Unlocked", price: 499.00, image: "images/iphone13-128-blue.jpg", rating: "⭐⭐⭐⭐⭐ (267 reviews)", condition: "Like New", badge: "Best Seller", category: "phones" },
    { id: 8, name: "Apple MacBook Air M1 Chip 256GB Space Gray", price: 799.00, image: "images/macbook-air-m1-256-spacegray.jpg", rating: "⭐⭐⭐⭐⭐ (198 reviews)", condition: "Excellent", badge: "Top Pick", category: "laptops" },
    { id: 9, name: "Google Pixel 6 128GB Black Unlocked", price: 329.00, image: "images/pixel6-128-black.jpg", rating: "⭐⭐⭐⭐⭐ (111 reviews)", condition: "Like New", badge: "Great Value", category: "phones" },
    { id: 10, name: "Sony WH1000XM4 Headphones Black", price: 249.00, image: "images/sony-wh1000xm4-black.jpg", rating: "⭐⭐⭐⭐⭐ (189 reviews)", condition: "Excellent", badge: "Popular", category: "audio" },
    { id: 11, name: "Lenovo ThinkPad X1 Carbon Gen 13", price: 949.99, image: "images/lenovo-thinkpad-x1-carbon.jpg", rating: "⭐⭐⭐⭐⭐ (76 reviews)", condition: "Like New", badge: "Premium", category: "laptops" },
    { id: 12, name: "Microsoft Surface Pro 8 256GB Platinum Intel I7", price: 899.00, image: "images/surface-pro8-8-256-platinum.jpg", rating: "⭐⭐⭐⭐⭐ (134 reviews)", condition: "Excellent", badge: "Top Pick", category: "tablets", specs: "Intel Core i7, 256GB SSD, 8GB RAM, Windows 11, Touchscreen Display" }
];

// === API ROUTE: Get all products ===
app.get('/api/products', async (req, res) => {
    try {
        await client.connect();
        const db = client.db("Cluster0");
        const productsCollection = db.collection("products");
        
        const allProducts = await productsCollection.find({}).toArray();
        res.status(200).json(allProducts);
        
    } catch (error) {
        console.error("Failed to fetch products:", error);
        res.status(500).send('Error fetching products from database');
    } finally {
        await client.close();
    }
});

// === API ROUTE: Get a SINGLE product by its ID ===
app.get('/api/products/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).send('Error: Product ID must be a number.');
        }
        await client.connect();
        const db = client.db("Cluster0");
        const productsCollection = db.collection("products");
        
        const product = await productsCollection.findOne({ id: productId });
        
        if (product) {
            res.status(200).json(product);
        } else {
            res.status(404).send('Product not found');
        }
        
    } catch (error) {
        console.error("Failed to fetch single product:", error);
        res.status(500).send('Error fetching product from database');
    } finally {
        await client.close();
    }
});

// === API ROUTE: One-time "seed" to add products ===
app.get('/seed', async (req, res) => {
    try {
        await client.connect();
        const db = client.db("Cluster0");
        const productsCollection = db.collection("products");
        
        await productsCollection.deleteMany({});
        const result = await productsCollection.insertMany(products);
        res.status(201).send(`Successfully inserted ${result.insertedCount} products!`);
        
    } catch (error) {
        console.error("Failed to seed database:", error);
        res.status(500).send('Error seeding database');
    } finally {
        await client.close();
    }
});

// === Original Test Routes ===
app.get('/', (req, res) => {
  res.send('Hello, your backend server is running!');
});

app.get('/testdb', async (req, res) => {
  try {
    await client.connect();
    res.send('Successfully connected to MongoDB!');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error connecting to the database');
  } finally {
    await client.close();
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
