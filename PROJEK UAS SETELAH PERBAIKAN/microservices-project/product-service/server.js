const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

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

// Initialize database connection
async function initDatabase() {
  try {
    db = await mysql.createConnection(dbConfig);
    
    // Create products table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        stock INT DEFAULT 0,
        category VARCHAR(100),
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Insert sample data
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM products');
    if (rows[0].count === 0) {
      const sampleProducts = [
        ['Laptop Gaming', 'Laptop gaming dengan spesifikasi tinggi', 15000000, 10, 'Electronics', 'https://via.placeholder.com/300x200?text=Laptop+Gaming'],
        ['Smartphone', 'Smartphone terbaru dengan kamera canggih', 8000000, 25, 'Electronics', 'https://via.placeholder.com/300x200?text=Smartphone'],
        ['Headphone Wireless', 'Headphone nirkabel dengan noise cancellation', 2500000, 15, 'Electronics', 'https://via.placeholder.com/300x200?text=Headphone'],
        ['Smart Watch', 'Jam tangan pintar dengan fitur kesehatan', 3000000, 20, 'Electronics', 'https://via.placeholder.com/300x200?text=Smart+Watch'],
        ['Tablet', 'Tablet untuk produktivitas dan entertainment', 6000000, 12, 'Electronics', 'https://via.placeholder.com/300x200?text=Tablet']
      ];
      
      for (const product of sampleProducts) {
        await db.execute(
          'INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)',
          product
        );
      }
    }
    
    console.log('Product service database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    setTimeout(initDatabase, 5000); // Retry after 5 seconds
  }
}

// Routes
app.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM products ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.post('/', async (req, res) => {
  try {
    const { name, description, price, stock, category, image_url } = req.body;
    const [result] = await db.execute(
      'INSERT INTO products (name, description, price, stock, category, image_url) VALUES (?, ?, ?, ?, ?, ?)',
      [name, description, price, stock, category, image_url || 'https://via.placeholder.com/300x200?text=Product']
    );
    
    const [newProduct] = await db.execute('SELECT * FROM products WHERE id = ?', [result.insertId]);
    res.status(201).json(newProduct[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/:id', async (req, res) => {
  try {
    const { name, description, price, stock, category, image_url } = req.body;
    await db.execute(
      'UPDATE products SET name = ?, description = ?, price = ?, stock = ?, category = ?, image_url = ? WHERE id = ?',
      [name, description, price, stock, category, image_url, req.params.id]
    );
    
    const [updated] = await db.execute('SELECT * FROM products WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM products WHERE id = ?', [req.params.id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Product service running on port ${PORT}`);
  initDatabase();
});
