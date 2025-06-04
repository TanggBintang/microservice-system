const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Product = require('./models/Product');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/product_db';
mongoose.connect(mongoUrl);

// Simple JWT verification function
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        if (decoded.exp < Date.now() / 1000) {
            return res.status(401).json({ error: 'Token expired' });
        }
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid token' });
    }
}

// Routes
app.get('/', (req, res) => {
    res.json({ message: 'Product Service is running' });
});

// Get all products (protected)
app.get('/products', verifyToken, async (req, res) => {
    try {
        const products = await Product.find();
        res.json({
            success: true,
            data: products,
            user: req.user.username
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get product by ID (protected)
app.get('/products/:id', verifyToken, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create product (protected)
app.post('/products', verifyToken, async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Initialize sample data
async function initializeData() {
    try {
        const count = await Product.countDocuments();
        if (count === 0) {
            const sampleProducts = [
                {
                    name: 'Laptop Gaming',
                    description: 'High-performance gaming laptop',
                    price: 15000000,
                    category: 'Electronics',
                    stock: 10
                },
                {
                    name: 'Smartphone',
                    description: 'Latest Android smartphone',
                    price: 8000000,
                    category: 'Electronics',
                    stock: 25
                },
                {
                    name: 'Wireless Headphones',
                    description: 'Premium noise-canceling headphones',
                    price: 2500000,
                    category: 'Audio',
                    stock: 15
                }
            ];
            await Product.insertMany(sampleProducts);
            console.log('Sample products created');
        }
    } catch (error) {
        console.error('Error initializing data:', error);
    }
}

app.listen(PORT, () => {
    console.log(`Product service running on port ${PORT}`);
    initializeData();
});