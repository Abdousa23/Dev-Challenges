const Database = require('better-sqlite3');
const users = require('../data/users.json');
const products = require('../data/products.json');

const db = new Database('filter.db');

// Drop and recreate tables
db.exec(`
  DROP TABLE IF EXISTS addresses;
  DROP TABLE IF EXISTS users;
  DROP TABLE IF EXISTS products;

  CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    active INTEGER DEFAULT 0,
    date_of_birth TEXT,
    phone TEXT,
    job TEXT,
    company TEXT,
    username TEXT,
    website TEXT,
    registered_at TEXT
  );

  CREATE TABLE addresses (
    user_id TEXT PRIMARY KEY,
    street TEXT,
    city TEXT,
    state TEXT,
    zipcode TEXT,
    country TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE products (
    id TEXT PRIMARY KEY,
    name TEXT,
    price REAL,
    category TEXT,
    brand TEXT,
    release_date TEXT,
    tags TEXT
  );
`);

// Normalize and process user data
const processUsers = users.users.map(user => {
  const isActiveFlag =
    user.active ?? user.is_active ?? user.isActive ?? (user.status?.toLowerCase() === 'active');

  const phone =
    user.phone || user.phoneNumber || user.Number || user.contactNumber || user.mobile || '';

  let dob = user['date of birth'] || user.dateOfBirth || null;

  if (!dob && user.age) {
    const now = new Date();
    const birthYear = now.getFullYear() - parseInt(user.age);
    dob = new Date(birthYear, 0, 1).toISOString();
  } else if (dob) {
    dob = new Date(dob).toISOString();
  }

  const registered_at = new Date(user.registered_at || user.registration_date || user.createdAt || Date.now()).toISOString();

  return {
    id: user.id,
    name: user.name || '',
    email: user.email || '',
    active: isActiveFlag ? 1 : 0,
    date_of_birth: dob,
    phone,
    job: user.job || '',
    company: user.company || '',
    username: user.username || '',
    website: user.website || '',
    registered_at,
    address: user.address || {}
  };
});

// Normalize product data
const processProducts = products.products.map(product => ({
  id: product.id,
  name: product.name,
  price: parseFloat(product.price) || 0.0,
  category: product.category || '',
  brand: product.brand || '',
  release_date: product.release_date || null,
  tags: product.tags ? JSON.stringify(product.tags) : null
}));

// Prepare insert statements
const insertUser = db.prepare(`
  INSERT INTO users (
    id, name, email, active, date_of_birth, phone,
    job, company, username, website, registered_at
  ) VALUES (
    @id, @name, @email, @active, @date_of_birth, @phone,
    @job, @company, @username, @website, @registered_at
  )
`);

const insertAddress = db.prepare(`
  INSERT INTO addresses (
    user_id, street, city, state, zipcode, country
  ) VALUES (
    @user_id, @street, @city, @state, @zipcode, @country
  )
`);

const insertProduct = db.prepare(`
  INSERT INTO products (
    id, name, price, category, brand, release_date, tags
  ) VALUES (
    @id, @name, @price, @category, @brand, @release_date, @tags
  )
`);

// Batch insert function
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

console.log('Inserting user addresses...');
const addressesData = processUsers
  .filter(user => user.address && Object.keys(user.address).length > 0)
  .map(user => ({
    user_id: user.id,
    street: user.address.street || '',
    city: user.address.city || '',
    state: user.address.state || '',
    zipcode: user.address.zipcode || '',
    country: user.address.country || ''
  }));
insertBatch(addressesData, insertAddress);

console.log('Inserting products...');
insertBatch(processProducts, insertProduct);

console.log('Database initialized successfully!');
db.close();
