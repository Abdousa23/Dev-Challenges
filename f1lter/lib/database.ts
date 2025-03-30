import Database from 'better-sqlite3';
import usersData from '@/data/users.json';
import productsData from '@/data/products.json';

const initializeDatabase = () => {
  const db = new Database('filter.db');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      active INTEGER,
      country TEXT,
      company TEXT,
      job TEXT,
      registered_at TEXT
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT,
      price REAL,
      category TEXT,
      brand TEXT,
      tags TEXT,
      release_date TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_users_active ON users(active);
    CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
  `);

  // Insert users
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users VALUES (
      @id,
      @name,
      @email,
      CASE 
        WHEN @active IS NOT NULL THEN @active
        WHEN @is_active IS NOT NULL THEN @is_active
        WHEN @status = 'active' THEN 1
        ELSE 0
      END,
      @address.country,
      @company,
      @job,
      @registered_at
    )`);

  // Insert products
  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products VALUES (
      @id,
      @name,
      @price,
      @category,
      @brand,
      @tags,
      @release_date
    )`);

  // Batch insert with transaction
  const insertBatch = db.transaction((items: any[], stmt: any) => {
    for (const item of items) {
      try {
        stmt.run(item);
      } catch (error) {
        console.error('Error inserting item:', error);
      }
    }
  });

  // Populate data
  insertBatch(usersData.users, insertUser);
  insertBatch(productsData.products, insertProduct);

  return db;
};

const db = initializeDatabase();

export default db;