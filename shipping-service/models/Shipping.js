const mongoose = require('mongoose');

const statusHistorySchema = new mongoose.Schema({
    status: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled']
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    notes: {
        type: String,
        default: ''
    },
    updatedBy: {
        type: String,
        default: 'system'
    }
});

const shippingSchema = new mongoose.Schema({
    trackingNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    productIds: [{
        type: String,
        required: true
    }],
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    customerPhone: {
        type: String,
        required: true,
        trim: true
    },
    destination: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        required: true
    },
    totalWeight: {
        type: Number,
        required: true,
        min: 0
    },
    shippingType: {
        type: String,
        required: true,
        enum: ['standard', 'express', 'overnight'],
        default: 'standard'
    },
    shippingCost: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        required: true,
        enum: ['pending', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'],
        default: 'pending'
    },
    statusHistory: [statusHistorySchema],
    createdBy: {
        type: String,
        required: false
    },
    deliveredAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update updatedAt before saving
shippingSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Shipping', shippingSchema);