import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { insertProductSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    return res.status(403).json({ error: "Access denied. Admin privileges required." });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // sets up /api/register, /api/login, /api/logout, /api/user
  setupAuth(app);

  // Product routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  app.get("/api/products/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }

      const products = await storage.searchProducts(query);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to search products" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }

      const category = await storage.getCategory(id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.get("/api/categories/:id/products", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid category ID" });
      }

      const products = await storage.getProductsByCategory(id);
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products by category" });
    }
  });

  // Order routes
  app.post("/api/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const orderSchema = z.object({
        items: z.array(
          z.object({
            productId: z.number(),
            quantity: z.number().min(1),
          })
        ),
      });

      const parseResult = orderSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error });
      }

      const { items } = parseResult.data;
      
      const order = await storage.createOrder(req.user.id, items);
      res.status(201).json(order);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.get("/api/orders/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }

      const orderData = await storage.getOrder(id);
      if (!orderData) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Only allow users to see their own orders
      if (orderData.order.userId !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }

      res.json(orderData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  app.get("/api/user/orders", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    try {
      const orders = await storage.getUserOrders(req.user.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user orders" });
    }
  });

  // Admin routes
  // Get all orders (admin only)
  app.get("/api/admin/orders", isAdmin, async (req, res) => {
    try {
      const orders = await storage.getAllOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch all orders" });
    }
  });

  // Update order status (admin only)
  app.patch("/api/admin/orders/:id/status", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid order ID" });
      }

      const { status } = req.body;
      if (!status || typeof status !== "string") {
        return res.status(400).json({ error: "Status is required" });
      }

      const updatedOrder = await storage.updateOrderStatus(id, status);
      if (!updatedOrder) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json(updatedOrder);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order status" });
    }
  });

  // Create product (admin only)
  app.post("/api/admin/products", isAdmin, async (req, res) => {
    try {
      const parseResult = insertProductSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error });
      }

      const newProduct = await storage.createProduct(parseResult.data);
      res.status(201).json(newProduct);
    } catch (error) {
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // Update product (admin only)
  app.patch("/api/admin/products/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      // Allow partial updates
      const productUpdateSchema = insertProductSchema.partial();
      const parseResult = productUpdateSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error });
      }

      const updatedProduct = await storage.updateProduct(id, parseResult.data);
      if (!updatedProduct) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.json(updatedProduct);
    } catch (error) {
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  // Delete product (admin only)
  app.delete("/api/admin/products/:id", isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid product ID" });
      }

      const result = await storage.deleteProduct(id);
      if (!result) {
        return res.status(404).json({ error: "Product not found" });
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // Create category (admin only)
  app.post("/api/admin/categories", isAdmin, async (req, res) => {
    try {
      const parseResult = insertCategorySchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error });
      }

      const newCategory = await storage.createCategory(parseResult.data);
      res.status(201).json(newCategory);
    } catch (error) {
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
