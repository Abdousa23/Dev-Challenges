const Database = require('better-sqlite3');
const users = require('../data/users.json');
const products = require('../data/products.json');

const db = new Database('filter.db');

// Create tables with simplified schema
db.exec(`
  DROP TABLE IF EXISTS users;
  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    active INTEGER DEFAULT 0,
    country TEXT,
    company TEXT,
    job TEXT,
    registered_at TEXT
  );
  
  DROP TABLE IF EXISTS products;
  CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT,
    price REAL,
    category TEXT,
    brand TEXT,
    release_date TEXT
  );
`);

// Process users with consistent field names
const processUsers = users.users.map(user => {
  // Handle different active status field names
  const active = [
    user.active,
    user.is_active,
    user.status === 'active'
  ].find(val => typeof val !== 'undefined') || false;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    active: active ? 1 : 0,
    country: user.address?.country || '',
    company: user.company || '',
    job: user.job || '',
    registered_at: new Date(user.registered_at).toISOString()
  };
});

// Process products with numeric conversion
const processProducts = products.products.map(product => ({
  id: product.id,
  name: product.name,
  price: parseFloat(product.price) || 0.0,
  category: product.category,
  brand: product.brand,
  release_date: product.release_date
}));

// User insert statement with explicit fields
const insertUser = db.prepare(`
  INSERT INTO users (
    id, 
    name, 
    email, 
    active, 
    country, 
    company, 
    job, 
    registered_at
  ) VALUES (
    @id,
    @name,
    @email,
    @active,
    @country,
    @company,
    @job,
    @registered_at
  )`);

// Product insert statement
const insertProduct = db.prepare(`
  INSERT INTO products (
    id,
    name,
    price,
    category,
    brand,
    release_date
  ) VALUES (
    @id,
    @name,
    @price,
    @category,
    @brand,
    @release_date
  )`);

// Batch insert with error handling
const insertBatch = (items, stmt) => {
  const insert = db.transaction((items) => {
    for (const item of items) {
      try {
        stmt.run(item);
      } catch (e) {
        console.error('Error inserting item:', e.message);
        console.log('Problematic item:', item);
      }
    }
  });
  insert(items);
};

// Execute inserts
console.log('Inserting users...');
insertBatch(processUsers, insertUser);

console.log('Inserting products...');
insertBatch(processProducts, insertProduct);

console.log('Database initialized successfully!');
db.close();