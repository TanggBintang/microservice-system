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

async function initDatabase() {
  try {
    db = await mysql.createConnection(dbConfig);
    
    // Create shipping table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS shipping (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        tracking_number VARCHAR(100) UNIQUE NOT NULL,
        carrier VARCHAR(100) NOT NULL,
        status ENUM('pending', 'picked_up', 'in_transit', 'delivered', 'failed') DEFAULT 'pending',
        shipping_address TEXT NOT NULL,
        estimated_delivery DATE,
        actual_delivery DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Insert sample data
    const [rows] = await db.execute('SELECT COUNT(*) as count FROM shipping');
    if (rows[0].count === 0) {
      const sampleShipping = [
        [1, 'TRK001234567', 'JNE Express', 'delivered', 'Jl. Sudirman No. 123, Jakarta', '2024-01-15', '2024-01-14'],
        [2, 'TRK001234568', 'TIKI Regular', 'in_transit', 'Jl. Thamrin No. 456, Jakarta', '2024-01-18', null],
        [3, 'TRK001234569', 'SiCepat Halu', 'delivered', 'Jl. Sudirman No. 123, Jakarta', '2024-01-12', '2024-01-12']
      ];
      
      for (const shipping of sampleShipping) {
        await db.execute(
          'INSERT INTO shipping (order_id, tracking_number, carrier, status, shipping_address, estimated_delivery, actual_delivery) VALUES (?, ?, ?, ?, ?, ?, ?)',
          shipping
        );
      }
    }
    
    console.log('Shipping service database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    setTimeout(initDatabase, 5000);
  }
}

// Routes
app.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM shipping ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shipping records' });
  }
});

app.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM shipping WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Shipping record not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch shipping record' });
  }
});

app.get('/track/:tracking_number', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM shipping WHERE tracking_number = ?', [req.params.tracking_number]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Tracking number not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to track shipment' });
  }
});

app.post('/', async (req, res) => {
  try {
    const { order_id, carrier, shipping_address, estimated_delivery, notes } = req.body;
    const tracking_number = 'TRK' + Date.now() + Math.floor(Math.random() * 1000);
    
    const [result] = await db.execute(
      'INSERT INTO shipping (order_id, tracking_number, carrier, shipping_address, estimated_delivery, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [order_id, tracking_number, carrier, shipping_address, estimated_delivery, notes]
    );
    
    const [newShipping] = await db.execute('SELECT * FROM shipping WHERE id = ?', [result.insertId]);
    res.status(201).json(newShipping[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create shipping record' });
  }
});

app.put('/:id/status', async (req, res) => {
  try {
    const { status, notes } = req.body;
    let updateQuery = 'UPDATE shipping SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP';
    let params = [status, notes];
    
    if (status === 'delivered') {
      updateQuery += ', actual_delivery = CURRENT_DATE';
    }
    
    updateQuery += ' WHERE id = ?';
    params.push(req.params.id);
    
    await db.execute(updateQuery, params);
    
    const [updated] = await db.execute('SELECT * FROM shipping WHERE id = ?', [req.params.id]);
    res.json(updated[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update shipping status' });
  }
});

app.delete('/:id', async (req, res) => {
  try {
    await db.execute('DELETE FROM shipping WHERE id = ?', [req.params.id]);
    res.json({ message: 'Shipping record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete shipping record' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Shipping service running on port ${PORT}`);
  initDatabase();
});
