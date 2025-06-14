const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Database connection
const dbConfig = {
  host: process.env.DB_HOST || 'app-db',
  user: process.env.DB_USER || 'appuser',
  password: process.env.DB_PASS || 'apppass',
  database: process.env.DB_NAME || 'app_db'
};

let db;

async function initDatabase() {
  try {
    db = await mysql.createConnection(dbConfig);
    
    // Create orders table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(50),
        total_amount DECIMAL(10,2) NOT NULL,
        status ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
        shipping_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create order_items table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      )
    `);
    
    // Insert sample data
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM orders');
    if (rows[0].count === 0) {
      // Sample orders
      await db.execute(`
        INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, total_amount, status, shipping_address) VALUES
        (1, 'John Doe', 'john@example.com', '08123456789', 17500000, 'confirmed', 'Jl. Sudirman No. 123, Jakarta'),
        (2, 'Jane Smith', 'jane@example.com', '08987654321', 8000000, 'shipped', 'Jl. Thamrin No. 456, Jakarta'),
        (1, 'John Doe', 'john@example.com', '08123456789', 2500000, 'delivered', 'Jl. Sudirman No. 123, Jakarta')
      `);
      
      // Sample order items
      await db.execute(`
        INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES
        (1, 1, 'Laptop Gaming', 15000000, 1),
        (1, 3, 'Headphone Wireless', 2500000, 1),
        (2, 2, 'Smartphone', 8000000, 1),
        (3, 3, 'Headphone Wireless', 2500000, 1)
      `);
    }
    
    console.log('Order service database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    setTimeout(initDatabase, 5000);
  }
}

// Routes
app.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT o.*, GROUP_CONCAT(CONCAT(oi.product_name, ' (', oi.quantity, ')') SEPARATOR ', ') as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.get('/:id', async (req, res) => {
  try {
    const [orders] = await db.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (orders.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const [items] = await db.execute('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
    
    res.json({
      ...orders[0],
      items: items
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

app.post('/', async (req, res) => {
  try {
    const { user_id, customer_name, customer_email, customer_phone, shipping_address, items } = req.body;
    
    // Calculate total
    let total_amount = 0;
    for (const item of items) {
      total_amount += item.price * item.quantity;
    }
    
    // Create order
    const [orderResult] = await db.execute(
      'INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, total_amount, shipping_address) VALUES (?, ?, ?, ?, ?, ?)',
      [user_id, customer_name, customer_email, customer_phone, total_amount, shipping_address]
    );
    
    const orderId = orderResult.insertId;
    
    // Add order items
    for (const item of items) {
      await db.execute(
        'INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.product_name, item.price, item.quantity]
      );
    }
    
    const [newOrder] = await db.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
    res.status(201).json(newOrder[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

app.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    await db.execute('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    
    const [updated] = await db.execute('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

app.delete('/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
  initDatabase();
});
