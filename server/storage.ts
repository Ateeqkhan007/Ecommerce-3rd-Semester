import { 
  users, 
  User, 
  InsertUser, 
  Product, 
  Category, 
  Order, 
  OrderItem 
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product methods
  getProducts(): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  getProductsByCategory(categoryId: number): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;
  createProduct(product: Omit<Product, "id">): Promise<Product>;
  updateProduct(id: number, product: Partial<Omit<Product, "id">>): Promise<Product | undefined>;
  deleteProduct(id: number): Promise<boolean>;
  
  // Category methods
  getCategories(): Promise<Category[]>;
  getCategory(id: number): Promise<Category | undefined>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: Omit<Category, "id">): Promise<Category>;
  
  // Order methods
  createOrder(userId: number, items: Array<{productId: number, quantity: number}>): Promise<Order>;
  getOrder(id: number): Promise<{order: Order, items: OrderItem[]} | undefined>;
  getUserOrders(userId: number): Promise<Order[]>;
  getAllOrders(): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<number, Product>;
  private categories: Map<number, Category>;
  private orders: Map<number, Order>;
  private orderItems: Map<number, OrderItem[]>;
  sessionStore: session.SessionStore;
  currentId: { users: number; products: number; categories: number; orders: number; orderItems: number };

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.categories = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.currentId = {
      users: 1,
      products: 1,
      categories: 1,
      orders: 1,
      orderItems: 1,
    };
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    // Create default admin user
    this.users.set(1, {
      id: 1,
      username: "admin",
      password: "$2b$10$XLxQH9EcUkFKVlR5xVqVwus1Xu7mCWOFXyGZU9bGCpq/cC/2z0Qdm", // "admin123" - hashed
      email: "admin@example.com",
      firstName: "Admin",
      lastName: "User",
      isAdmin: true
    });
    this.currentId.users = 2;
    
    // Create categories
    const electronics = this.initCategory({ name: "Electronics", slug: "electronics" });
    const clothing = this.initCategory({ name: "Clothing", slug: "clothing" });
    const home = this.initCategory({ name: "Home & Furniture", slug: "home-furniture" });
    const beauty = this.initCategory({ name: "Beauty", slug: "beauty" });
    const sports = this.initCategory({ name: "Sports & Outdoors", slug: "sports" });
    const books = this.initCategory({ name: "Books", slug: "books" });

    // Create products
    this.initProduct({
      name: "Nike Air Max",
      description: "Premium men's running shoes with Air cushioning technology for maximum comfort and support. Perfect for running, training, or casual wear.",
      shortDescription: "Men's Running Shoe",
      price: 129.99,
      imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
      categoryId: clothing.id,
      rating: 4.5,
      inStock: true,
      isNew: true,
      brand: "Nike"
    });

    this.initProduct({
      name: "Smart Watch Pro",
      description: "Advanced smartwatch with health monitoring, GPS tracking, and notification features. Water-resistant and compatible with iOS and Android.",
      shortDescription: "Fitness Tracker",
      price: 199.99,
      imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
      categoryId: electronics.id,
      rating: 4.0,
      inStock: true,
      isSale: true,
      brand: "SmartGear"
    });

    this.initProduct({
      name: "Wireless Headphones",
      description: "Experience immersive sound with these wireless noise-cancelling headphones. 30-hour battery life and comfortable over-ear design.",
      shortDescription: "Noise Cancelling",
      price: 149.99,
      imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
      categoryId: electronics.id,
      rating: 5.0,
      inStock: true,
      isNew: false,
      isSale: false,
      brand: "SoundPro"
    });

    this.initProduct({
      name: "Smartphone X",
      description: "High-performance smartphone with an amazing camera, all-day battery life, and premium design. Features the latest mobile technology.",
      shortDescription: "128GB, Midnight Black",
      price: 899.99,
      imageUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9",
      categoryId: electronics.id,
      rating: 4.0,
      inStock: true,
      isNew: false,
      isSale: false,
      brand: "TechMaster"
    });

    this.initProduct({
      name: "Minimalist Chair",
      description: "Elegant minimalist chair made from high-quality materials. Adds a touch of modern style to any room. Comfortable and durable.",
      shortDescription: "Wooden, White",
      price: 89.99,
      imageUrl: "https://images.unsplash.com/photo-1503602642458-232111445657",
      categoryId: home.id,
      rating: 3.5,
      inStock: true,
      isNew: false,
      isSale: false,
      brand: "ModernHome"
    });

    this.initProduct({
      name: "Digital Camera",
      description: "Professional-grade digital camera with 24MP sensor and 4K video capabilities. Ideal for photography enthusiasts and content creators.",
      shortDescription: "24MP, 4K Video",
      price: 499.99,
      imageUrl: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f",
      categoryId: electronics.id,
      rating: 4.0,
      inStock: true,
      isNew: false,
      isSale: true,
      brand: "CapturePro"
    });

    this.initProduct({
      name: "Wireless Earbuds",
      description: "Compact, high-quality wireless earbuds with crystal-clear sound and long battery life. Includes charging case and multiple ear tip sizes.",
      shortDescription: "Bluetooth 5.0",
      price: 79.99,
      imageUrl: "https://images.unsplash.com/photo-1505751171710-1f6d0ace5a85",
      categoryId: electronics.id,
      rating: 4.0,
      inStock: true,
      isNew: false,
      isSale: false,
      brand: "SoundPro"
    });

    this.initProduct({
      name: "Headphone Stand",
      description: "Elegant aluminum headphone stand to display and store your headphones. Keeps your desk organized while looking stylish.",
      shortDescription: "Aluminum",
      price: 29.99,
      imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b",
      categoryId: home.id,
      rating: 4.5,
      inStock: true,
      isNew: false,
      isSale: false,
      brand: "DeskOrganizer"
    });
  }

  private initCategory(data: { name: string; slug: string }): Category {
    const id = this.currentId.categories++;
    const category: Category = { id, ...data };
    this.categories.set(id, category);
    return category;
  }

  private initProduct(data: Partial<Omit<Product, "id">>): Product {
    const id = this.currentId.products++;
    const product: Product = { 
      id, 
      ...data,
      name: data.name || "",
      description: data.description || "",
      price: data.price || 0,
      imageUrl: data.imageUrl || "",
      categoryId: data.categoryId || 1,
      inStock: data.inStock ?? true,
      isNew: data.isNew ?? false,
      isSale: data.isSale ?? false 
    };
    this.products.set(id, product);
    return product;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.users++;
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: insertUser.isAdmin ?? false
    };
    this.users.set(id, user);
    return user;
  }

  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.categoryId === categoryId,
    );
  }

  async searchProducts(query: string): Promise<Product[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.products.values()).filter(
      (product) => 
        product.name.toLowerCase().includes(lowerQuery) || 
        product.description.toLowerCase().includes(lowerQuery) ||
        product.brand?.toLowerCase().includes(lowerQuery)
    );
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategory(id: number): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return Array.from(this.categories.values()).find(
      (category) => category.slug === slug,
    );
  }

  async createOrder(
    userId: number, 
    items: Array<{ productId: number; quantity: number }>
  ): Promise<Order> {
    const id = this.currentId.orders++;
    let total = 0;
    
    const orderItems: OrderItem[] = [];
    
    for (const item of items) {
      const product = await this.getProduct(item.productId);
      if (!product) {
        throw new Error(`Product with id ${item.productId} not found`);
      }
      
      const price = product.price * item.quantity;
      total += price;
      
      const orderItemId = this.currentId.orderItems++;
      const orderItem: OrderItem = {
        id: orderItemId,
        orderId: id,
        productId: item.productId,
        quantity: item.quantity,
        price: product.price
      };
      
      orderItems.push(orderItem);
    }
    
    const order: Order = {
      id,
      userId,
      status: "pending",
      total,
      createdAt: new Date().toISOString()
    };
    
    this.orders.set(id, order);
    this.orderItems.set(id, orderItems);
    
    return order;
  }

  async getOrder(id: number): Promise<{ order: Order; items: OrderItem[] } | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const items = this.orderItems.get(id) || [];
    return { order, items };
  }

  async getUserOrders(userId: number): Promise<Order[]> {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId,
    );
  }

  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.orders.values());
  }

  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, status };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async createProduct(product: Omit<Product, "id">): Promise<Product> {
    const id = this.currentId.products++;
    const newProduct: Product = { ...product, id };
    this.products.set(id, newProduct);
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<Omit<Product, "id">>): Promise<Product | undefined> {
    const existingProduct = this.products.get(id);
    if (!existingProduct) return undefined;
    
    const updatedProduct: Product = { ...existingProduct, ...product };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    return this.products.delete(id);
  }

  async createCategory(category: Omit<Category, "id">): Promise<Category> {
    const id = this.currentId.categories++;
    const newCategory: Category = { ...category, id };
    this.categories.set(id, newCategory);
    return newCategory;
  }
}

export const storage = new MemStorage();
