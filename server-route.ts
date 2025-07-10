import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProductSchema, 
  insertOrderSchema, 
  insertOrderItemSchema, 
  insertCartItemSchema, 
  insertAdminUserSchema, 
  insertNotificationSchema 
} from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { nanoid } from "nanoid";

const jwtSecret = process.env.JWT_SECRET || "your-super-secret-jwt-key";

const authenticateAdmin = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

const getSessionId = (req: Request): string => {
  if (!req.session.id) {
    req.session.id = nanoid();
  }
  return req.session.id;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Product routes
  app.get('/api/products', async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ message: 'Failed to fetch products' });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProduct(parseInt(req.params.id));
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ message: 'Failed to fetch product' });
    }
  });

  app.post('/api/products', authenticateAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid product data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create product' });
    }
  });

  app.put('/api/products/:id', authenticateAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(parseInt(req.params.id), productData);
      res.json(product);
    } catch (error) {
      console.error('Error updating product:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid product data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update product' });
    }
  });

  app.delete('/api/products/:id', authenticateAdmin, async (req, res) => {
    try {
      await storage.deleteProduct(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Failed to delete product' });
    }
  });

  // Cart routes
  app.get('/api/cart', async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const cartItems = await storage.getCartItems(sessionId);
      res.json(cartItems);
    } catch (error) {
      console.error('Error fetching cart:', error);
      res.status(500).json({ message: 'Failed to fetch cart' });
    }
  });

  app.post('/api/cart', async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        sessionId
      });
      const cartItem = await storage.addToCart(cartItemData);
      res.status(201).json(cartItem);
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid cart item data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to add to cart' });
    }
  });

  app.put('/api/cart/:id', async (req, res) => {
    try {
      const { quantity } = req.body;
      const cartItem = await storage.updateCartItem(parseInt(req.params.id), quantity);
      res.json(cartItem);
    } catch (error) {
      console.error('Error updating cart item:', error);
      res.status(500).json({ message: 'Failed to update cart item' });
    }
  });

  app.delete('/api/cart/:id', async (req, res) => {
    try {
      await storage.removeFromCart(parseInt(req.params.id));
      res.status(204).send();
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({ message: 'Failed to remove from cart' });
    }
  });

  app.delete('/api/cart', async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      await storage.clearCart(sessionId);
      res.status(204).send();
    } catch (error) {
      console.error('Error clearing cart:', error);
      res.status(500).json({ message: 'Failed to clear cart' });
    }
  });

  // Order routes
  app.post('/api/orders', async (req, res) => {
    try {
      const sessionId = getSessionId(req);
      const orderData = insertOrderSchema.parse(req.body);
      const { orderItems, ...orderInfo } = req.body;
      
      // Create order
      const order = await storage.createOrder(orderInfo);
      
      // Create order items
      for (const item of orderItems) {
        const orderItemData = insertOrderItemSchema.parse({
          ...item,
          orderId: order.id
        });
        await storage.createOrderItem(orderItemData);
      }
      
      // Clear cart after successful order
      await storage.clearCart(sessionId);
      
      res.status(201).json(order);
    } catch (error) {
      console.error('Error creating order:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid order data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create order' });
    }
  });

  app.get('/api/orders', authenticateAdmin, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({ message: 'Failed to fetch orders' });
    }
  });

  app.get('/api/orders/:id', authenticateAdmin, async (req, res) => {
    try {
      const order = await storage.getOrder(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }
      res.json(order);
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({ message: 'Failed to fetch order' });
    }
  });

  app.put('/api/orders/:id/status', authenticateAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      const order = await storage.updateOrderStatus(parseInt(req.params.id), status);
      res.json(order);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ message: 'Failed to update order status' });
    }
  });

  // Admin authentication routes
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      
      const admin = await storage.getAdminUser(username);
      if (!admin) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const isValidPassword = await bcrypt.compare(password, admin.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      const token = jwt.sign({ username: admin.username }, jwtSecret, { expiresIn: '24h' });
      res.json({ token, admin: { username: admin.username, email: admin.email } });
    } catch (error) {
      console.error('Error during admin login:', error);
      res.status(500).json({ message: 'Login failed' });
    }
  });

  app.post('/api/admin/register', async (req, res) => {
    try {
      const { username, password, email } = req.body;
      
      // Check if admin already exists
      const existingAdmin = await storage.getAdminUser(username);
      if (existingAdmin) {
        return res.status(400).json({ message: 'Admin already exists' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const adminData = insertAdminUserSchema.parse({
        username,
        password: hashedPassword,
        email
      });
      
      const admin = await storage.createAdminUser(adminData);
      res.status(201).json({ message: 'Admin created successfully' });
    } catch (error) {
      console.error('Error creating admin:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid admin data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create admin' });
    }
  });

  // Mock payment processing
  app.post('/api/payment/process', async (req, res) => {
    try {
      const { cardNumber, expiryDate, cvv, amount } = req.body;
      
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock payment success (in real implementation, integrate with payment gateway)
      const success = Math.random() > 0.1; // 90% success rate
      
      if (success) {
        res.json({ 
          success: true, 
          transactionId: nanoid(),
          message: 'Payment processed successfully' 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: 'Payment failed. Please try again.' 
        });
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({ message: 'Payment processing failed' });
    }
  });

  // Notification routes
  app.post('/api/notifications', authenticateAdmin, async (req, res) => {
    try {
      const notificationData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(notificationData);
      
      // Mock email sending (in real implementation, integrate with email service)
      console.log(`Mock email sent: ${notification.message}`);
      
      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid notification data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create notification' });
    }
  });

  app.get('/api/notifications', authenticateAdmin, async (req, res) => {
    try {
      const notifications = await storage.getNotifications();
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ message: 'Failed to fetch notifications' });
    }
  });

  // Admin stats endpoint
  app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
    try {
      const [products, orders] = await Promise.all([
        storage.getProducts(),
        storage.getOrders()
      ]);
      
      const totalRevenue = orders.reduce((sum, order) => 
        sum + parseFloat(order.totalAmount), 0
      );
      
      const stats = {
        totalProducts: products.length,
        totalOrders: orders.length,
        totalRevenue: totalRevenue,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'completed').length
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
