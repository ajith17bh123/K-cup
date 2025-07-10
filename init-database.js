#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { products, adminUsers } from './shared/schema.js';
import bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // Check if products already exist
    const existingProducts = await db.select().from(products).limit(1);
    
    if (existingProducts.length === 0) {
      console.log('Adding sample products...');
      
      await db.insert(products).values([
        {
          name: 'Ethiopian Sidamo',
          description: 'A bright, floral coffee with wine-like acidity and a clean finish. Notes of citrus, berries, and tea-like qualities.',
          price: '24.99',
          imageUrl: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=400',
          category: 'Single Origin',
          origin: 'Ethiopia',
          roastLevel: 'Light Roast',
          inStock: true
        },
        {
          name: 'Colombian Supremo',
          description: 'Rich, full-bodied coffee with perfect balance. Chocolate and caramel notes with a smooth, nutty finish.',
          price: '22.99',
          imageUrl: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=400',
          category: 'Single Origin',
          origin: 'Colombia',
          roastLevel: 'Medium Roast',
          inStock: true
        },
        {
          name: 'Brazilian Santos',
          description: 'Smooth, low-acid coffee with chocolatey sweetness. Perfect for espresso or drip brewing.',
          price: '19.99',
          imageUrl: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=400',
          category: 'Single Origin',
          origin: 'Brazil',
          roastLevel: 'Dark Roast',
          inStock: true
        },
        {
          name: 'Guatemalan Antigua',
          description: 'Complex, full-bodied coffee with spicy and smoky notes. Rich volcanic soil creates distinctive flavor.',
          price: '26.99',
          imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=400',
          category: 'Single Origin',
          origin: 'Guatemala',
          roastLevel: 'Medium Roast',
          inStock: true
        },
        {
          name: 'House Blend',
          description: 'Our signature blend combining the best of South American and African beans. Balanced and approachable.',
          price: '18.99',
          imageUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=400',
          category: 'Blend',
          origin: 'Multi-Origin',
          roastLevel: 'Medium Roast',
          inStock: true
        },
        {
          name: 'Espresso Roast',
          description: 'Dark, rich blend perfect for espresso. Bold flavor with low acidity and lingering finish.',
          price: '21.99',
          imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=400',
          category: 'Blend',
          origin: 'Multi-Origin',
          roastLevel: 'Dark Roast',
          inStock: true
        },
        {
          name: 'French Roast',
          description: 'Bold, intense coffee with smoky, charred notes. For those who love their coffee strong and dark.',
          price: '20.99',
          imageUrl: 'https://images.unsplash.com/photo-1571125515756-8f1b7de1b3f4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=400',
          category: 'Blend',
          origin: 'Multi-Origin',
          roastLevel: 'Dark Roast',
          inStock: true
        },
        {
          name: 'Jamaican Blue Mountain',
          description: 'One of the worlds finest coffees. Mild, sweet, and exceptionally smooth with no bitterness.',
          price: '49.99',
          imageUrl: 'https://images.unsplash.com/photo-1511920170033-f8396924c348?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=400',
          category: 'Premium',
          origin: 'Jamaica',
          roastLevel: 'Light Roast',
          inStock: true
        },
        {
          name: 'Kona Coffee',
          description: 'Hawaiian grown coffee with smooth, rich flavor. Buttery texture with hints of spice and nuts.',
          price: '39.99',
          imageUrl: 'https://images.unsplash.com/photo-1585068719693-928d17c4ad24?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=400',
          category: 'Premium',
          origin: 'Hawaii',
          roastLevel: 'Medium Roast',
          inStock: true
        },
        {
          name: 'Decaf Colombian',
          description: 'All the flavor of our Colombian Supremo without the caffeine. Swiss water process preserves taste.',
          price: '23.99',
          imageUrl: 'https://images.unsplash.com/photo-1495774856032-8b90bbb32b32?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=400&h=400',
          category: 'Decaf',
          origin: 'Colombia',
          roastLevel: 'Medium Roast',
          inStock: true
        }
      ]);
      
      console.log('Sample products added successfully!');
    } else {
      console.log('Products already exist, skipping...');
    }
    
    // Check if admin user exists
    const existingAdmins = await db.select().from(adminUsers).limit(1);
    
    if (existingAdmins.length === 0) {
      console.log('Creating default admin user...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.insert(adminUsers).values({
        username: 'admin',
        password: hashedPassword,
        email: 'admin@kcup.com'
      });
      
      console.log('Default admin user created!');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      console.log('Admin user already exists, skipping...');
    }
    
    console.log('Database initialization completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
