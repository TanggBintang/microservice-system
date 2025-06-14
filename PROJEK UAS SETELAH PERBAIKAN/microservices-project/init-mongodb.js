// init-mongodb.js
// Script untuk initialize sample data

// Sample Products
db = db.getSiblingDB('product_db');
db.products.insertMany([
    {
        name: "Laptop Gaming",
        description: "High performance gaming laptop",
        price: 15000000,
        stock: 10
    },
    {
        name: "Smartphone",
        description: "Latest Android smartphone",
        price: 8000000,
        stock: 25
    },
    {
        name: "Wireless Headphones",
        description: "Noise cancelling headphones",
        price: 2500000,
        stock: 50
    }
]);

// Sample Orders
db = db.getSiblingDB('order_db');
db.orders.insertMany([
    {
        userId: "user1",
        products: [
            { productId: "prod1", quantity: 1, price: 15000000 }
        ],
        total: 15000000
    }
]);

// Sample Shipping
db = db.getSiblingDB('shipping_db');
db.shippings.insertMany([
    {
        orderId: "order1",
        status: "shipped",
        trackingNumber: "TRK123456789"
    }
]);

print("Sample data inserted successfully!");