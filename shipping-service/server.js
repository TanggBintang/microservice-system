const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const axios = require('axios');
const Shipping = require('./models/Shipping');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const mongoUrl = process.env.MONGO_URL || 'mongodb://localhost:27017/shipping_db';
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

// Helper function to validate product exists
async function validateProduct(productId) {
    try {
        // In real scenario, this would call Product Service API
        // For demo, we'll simulate product validation
        const validProducts = ['6507f1f1e4b0c12345678901', '6507f1f1e4b0c12345678902', '6507f1f1e4b0c12345678903'];
        return validProducts.includes(productId) || productId.length === 24; // Basic MongoDB ObjectId validation
    } catch (error) {
        return false;
    }
}

// Helper function to calculate shipping cost
function calculateShippingCost(destination, weight, shippingType) {
    const baseCost = {
        'standard': 10000,
        'express': 25000,
        'overnight': 50000
    };
    
    const weightMultiplier = Math.ceil(weight / 1000); // per kg
    const base = baseCost[shippingType] || baseCost['standard'];
    
    // Distance-based multiplier (simplified)
    const distanceMultiplier = destination.toLowerCase().includes('jakarta') ? 1 : 1.5;
    
    return base * weightMultiplier * distanceMultiplier;
}

// Routes
app.get('/', (req, res) => {
    res.json({ 
        message: 'Shipping Service is running',
        endpoints: {
            'GET /': 'Service info',
            'GET /shipments': 'Get all shipments (protected)',
            'GET /shipments/:id': 'Get shipment by ID (protected)',
            'POST /shipments': 'Create new shipment (protected)',
            'PUT /shipments/:id/status': 'Update shipment status (protected)',
            'GET /calculate-cost': 'Calculate shipping cost (protected)'
        }
    });
});

// Calculate shipping cost
app.get('/calculate-cost', verifyToken, (req, res) => {
    const { destination, weight, shippingType = 'standard' } = req.query;
    
    if (!destination || !weight) {
        return res.status(400).json({ 
            error: 'Destination and weight are required',
            example: '/calculate-cost?destination=Jakarta&weight=1500&shippingType=express'
        });
    }
    
    const cost = calculateShippingCost(destination, parseFloat(weight), shippingType);
    
    res.json({
        success: true,
        data: {
            destination,
            weight: `${weight}g`,
            shippingType,
            estimatedCost: cost,
            currency: 'IDR',
            estimatedDays: shippingType === 'overnight' ? 1 : shippingType === 'express' ? 2 : 5
        }
    });
});

// Get all shipments (protected)
app.get('/shipments', verifyToken, async (req, res) => {
    try {
        const { status, destination } = req.query;
        let filter = {};
        
        if (status) filter.status = status;
        if (destination) filter.destination = new RegExp(destination, 'i');
        
        const shipments = await Shipping.find(filter).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            data: shipments,
            count: shipments.length,
            user: req.user.username
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get shipment by ID (protected)
app.get('/shipments/:id', verifyToken, async (req, res) => {
    try {
        const shipment = await Shipping.findById(req.params.id);
        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }
        res.json({
            success: true,
            data: shipment
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create new shipment (protected)
app.post('/shipments', verifyToken, async (req, res) => {
    try {
        const { 
            productIds, 
            customerName, 
            customerPhone, 
            destination, 
            address,
            totalWeight,
            shippingType = 'standard'
        } = req.body;
        
        // Validation
        if (!productIds || !customerName || !destination || !address || !totalWeight) {
            return res.status(400).json({ 
                error: 'Missing required fields: productIds, customerName, destination, address, totalWeight' 
            });
        }
        
        // Calculate shipping cost
        const shippingCost = calculateShippingCost(destination, totalWeight, shippingType);
        
        // Generate tracking number
        const trackingNumber = 'SHIP' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
        
        const shipment = new Shipping({
            trackingNumber,
            productIds,
            customerName,
            customerPhone,
            destination,
            address,
            totalWeight,
            shippingType,
            shippingCost,
            status: 'pending',
            createdBy: req.user.user_id,
            statusHistory: [{
                status: 'pending',
                timestamp: new Date(),
                notes: 'Shipment created'
            }]
        });
        
        await shipment.save();
        
        res.status(201).json({
            success: true,
            data: shipment,
            message: 'Shipment created successfully'
        });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update shipment status (protected)
app.put('/shipments/:id/status', verifyToken, async (req, res) => {
    try {
        const { status, notes = '' } = req.body;
        
        const validStatuses = ['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                error: 'Invalid status',
                validStatuses 
            });
        }
        
        const shipment = await Shipping.findById(req.params.id);
        if (!shipment) {
            return res.status(404).json({ error: 'Shipment not found' });
        }
        
        // Add to status history
        shipment.statusHistory.push({
            status,
            timestamp: new Date(),
            notes,
            updatedBy: req.user.username
        });
        
        shipment.status = status;
        if (status === 'delivered') {
            shipment.deliveredAt = new Date();
        }
        
        await shipment.save();
        
        res.json({
            success: true,
            data: shipment,
            message: `Shipment status updated to ${status}`
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get shipment tracking info (public endpoint)
app.get('/track/:trackingNumber', async (req, res) => {
    try {
        const shipment = await Shipping.findOne({ 
            trackingNumber: req.params.trackingNumber 
        }).select('-createdBy -productIds');
        
        if (!shipment) {
            return res.status(404).json({ error: 'Tracking number not found' });
        }
        
        res.json({
            success: true,
            data: {
                trackingNumber: shipment.trackingNumber,
                status: shipment.status,
                destination: shipment.destination,
                customerName: shipment.customerName,
                shippingType: shipment.shippingType,
                createdAt: shipment.createdAt,
                deliveredAt: shipment.deliveredAt,
                statusHistory: shipment.statusHistory
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Initialize sample data
async function initializeData() {
    try {
        const count = await Shipping.countDocuments();
        if (count === 0) {
            const sampleShipments = [
                {
                    trackingNumber: 'SHIP1703001DEMO',
                    productIds: ['sample_product_1', 'sample_product_2'],
                    customerName: 'John Doe',
                    customerPhone: '08123456789',
                    destination: 'Jakarta',
                    address: 'Jl. Sudirman No. 123, Jakarta Pusat',
                    totalWeight: 2500,
                    shippingType: 'express',
                    shippingCost: 37500,
                    status: 'in_transit',
                    statusHistory: [
                        {
                            status: 'pending',
                            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                            notes: 'Shipment created'
                        },
                        {
                            status: 'processing',
                            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                            notes: 'Package prepared'
                        },
                        {
                            status: 'shipped',
                            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
                            notes: 'Package picked up by courier'
                        },
                        {
                            status: 'in_transit',
                            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
                            notes: 'Package in transit to Jakarta'
                        }
                    ]
                },
                {
                    trackingNumber: 'SHIP1703002DEMO',
                    productIds: ['sample_product_3'],
                    customerName: 'Jane Smith',
                    customerPhone: '08987654321',
                    destination: 'Surabaya',
                    address: 'Jl. Pemuda No. 456, Surabaya',
                    totalWeight: 1200,
                    shippingType: 'standard',
                    shippingCost: 15000,
                    status: 'delivered',
                    deliveredAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    statusHistory: [
                        {
                            status: 'pending',
                            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                            notes: 'Shipment created'
                        },
                        {
                            status: 'processing',
                            timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
                            notes: 'Package prepared'
                        },
                        {
                            status: 'shipped',
                            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                            notes: 'Package picked up'
                        },
                        {
                            status: 'in_transit',
                            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                            notes: 'Package in transit'
                        },
                        {
                            status: 'delivered',
                            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                            notes: 'Package delivered successfully'
                        }
                    ]
                }
            ];
            
            await Shipping.insertMany(sampleShipments);
            console.log('Sample shipments created');
        }
    } catch (error) {
        console.error('Error initializing shipping data:', error);
    }
}

app.listen(PORT, () => {
    console.log(`Shipping service running on port ${PORT}`);
    initializeData();
});