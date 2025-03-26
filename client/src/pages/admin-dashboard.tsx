import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Product, Category, Order } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Plus, 
  Trash2, 
  Package, 
  ShoppingCart, 
  Tag, 
  Search, 
  Settings, 
  BarChart3, 
  Users, 
  DollarSign, 
  TrendingUp,
  Loader2 
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [productFormOpen, setProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: 0,
    imageUrl: "",
    categoryId: 0,
    shortDescription: "",
    brand: "",
    rating: 0,
    inStock: true,
    isNew: false,
    isSale: false
  });

  // Queries
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    enabled: !!user?.isAdmin
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    enabled: !!user?.isAdmin
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    enabled: !!user?.isAdmin
  });

  // Mutations
  const createProductMutation = useMutation({
    mutationFn: async (product: Omit<Product, "id">) => {
      const res = await apiRequest("POST", "/api/admin/products", product);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product created",
        description: "The product has been created successfully.",
      });
      setProductFormOpen(false);
      resetProductForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create product",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, product }: { id: number; product: Partial<Omit<Product, "id">> }) => {
      const res = await apiRequest("PATCH", `/api/admin/products/${id}`, product);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product updated",
        description: "The product has been updated successfully.",
      });
      setProductFormOpen(false);
      setEditingProduct(null);
      resetProductForm();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update product",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Product deleted",
        description: "The product has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete product",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await apiRequest("PATCH", `/api/admin/orders/${id}/status`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({
        title: "Order updated",
        description: "The order status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update order",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Reset product form
  const resetProductForm = () => {
    setProductForm({
      name: "",
      description: "",
      price: 0,
      imageUrl: "",
      categoryId: 0,
      shortDescription: "",
      brand: "",
      rating: 0,
      inStock: true,
      isNew: false,
      isSale: false
    });
  };

  // Handle product form changes
  const handleProductFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "number") {
      setProductForm({ ...productForm, [name]: parseFloat(value) });
    } else {
      setProductForm({ ...productForm, [name]: value });
    }
  };

  // Handle switch toggle
  const handleSwitchChange = (name: string, value: boolean) => {
    setProductForm({ ...productForm, [name]: value });
  };

  // Handle category select
  const handleCategoryChange = (value: string) => {
    setProductForm({ ...productForm, categoryId: parseInt(value) });
  };

  // Open edit product dialog
  const openEditProductDialog = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      imageUrl: product.imageUrl,
      categoryId: product.categoryId,
      shortDescription: product.shortDescription || "",
      brand: product.brand || "",
      rating: product.rating || 0,
      inStock: product.inStock || true,
      isNew: product.isNew || false,
      isSale: product.isSale || false
    });
    setProductFormOpen(true);
  };

  // Handle product form submit
  const handleProductFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      updateProductMutation.mutate({ 
        id: editingProduct.id, 
        product: productForm 
      });
    } else {
      createProductMutation.mutate(productForm as Omit<Product, "id">);
    }
  };

  // Handle order status update
  const handleOrderStatusUpdate = (orderId: number, status: string) => {
    updateOrderStatusMutation.mutate({ id: orderId, status });
  };

  // Handle delete product
  const handleDeleteProduct = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProductMutation.mutate(id);
    }
  };

  // Open new product dialog
  const openNewProductDialog = () => {
    setEditingProduct(null);
    resetProductForm();
    setProductFormOpen(true);
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not admin
  if (!authLoading && (!user || !user.isAdmin)) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-sm border-r h-full flex flex-col">
        <div className="p-4 border-b flex items-center">
          <div className="h-10 w-10 rounded-md bg-black text-white flex items-center justify-center font-bold text-xl mr-3">
            W
          </div>
          <div>
            <div className="font-medium text-gray-500">Welcome,</div>
            <div className="font-bold">{user?.username || "Admin"}</div>
          </div>
        </div>
        
        {/* Sidebar menu */}
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <button 
                className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-3 ${activeTab === 'dashboard' ? 'bg-gray-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <BarChart3 className="h-5 w-5" />
                <span>Dashboard</span>
              </button>
            </li>
            <li>
              <button 
                className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-3 ${activeTab === 'products' ? 'bg-gray-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('products')}
              >
                <Package className="h-5 w-5" />
                <span>Products</span>
              </button>
            </li>
            <li>
              <button 
                className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-3 ${activeTab === 'orders' ? 'bg-gray-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('orders')}
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Orders</span>
              </button>
            </li>
            <li>
              <button 
                className={`w-full text-left px-3 py-2 rounded-md flex items-center space-x-3 ${activeTab === 'categories' ? 'bg-gray-100 text-blue-600' : 'text-gray-700 hover:bg-gray-100'}`}
                onClick={() => setActiveTab('categories')}
              >
                <Tag className="h-5 w-5" />
                <span>Categories</span>
              </button>
            </li>
            <li>
              <button 
                className="w-full text-left px-3 py-2 rounded-md flex items-center space-x-3 text-gray-700 hover:bg-gray-100"
              >
                <Users className="h-5 w-5" />
                <span>Customers</span>
              </button>
            </li>
            <li>
              <button 
                className="w-full text-left px-3 py-2 rounded-md flex items-center space-x-3 text-gray-700 hover:bg-gray-100"
              >
                <Settings className="h-5 w-5" />
                <span>Settings</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm border-b p-4 flex justify-between items-center">
          <div className="text-xl font-semibold">
            {activeTab === 'dashboard' && 'Dashboard'}
            {activeTab === 'products' && 'Products'}
            {activeTab === 'orders' && 'Orders'}
            {activeTab === 'categories' && 'Categories'}
          </div>
          <div className="flex items-center">
            <div className="relative mr-4">
              <Search className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search your store..."
                className="pl-10 w-60 h-10"
              />
            </div>
            <button className="p-2 rounded-full hover:bg-gray-100">
              <Settings className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </header>
        
        {/* Page content */}
        <div className="p-6">
          {/* Dashboard content */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">New users</p>
                        <h3 className="text-2xl font-bold mt-1">1,345</h3>
                      </div>
                      <div className="rounded-full bg-blue-50 p-3">
                        <Users className="h-6 w-6 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Store visits</p>
                        <h3 className="text-2xl font-bold mt-1">2,890</h3>
                      </div>
                      <div className="rounded-full bg-indigo-50 p-3">
                        <BarChart3 className="h-6 w-6 text-indigo-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Revenue this month</p>
                        <h3 className="text-2xl font-bold mt-1">$1,870</h3>
                      </div>
                      <div className="rounded-full bg-yellow-50 p-3">
                        <DollarSign className="h-6 w-6 text-yellow-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Conversion rate</p>
                        <h3 className="text-2xl font-bold mt-1">5.10%</h3>
                      </div>
                      <div className="rounded-full bg-red-50 p-3">
                        <TrendingUp className="h-6 w-6 text-red-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Latest sales</h2>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="text-xs h-8">Day</Button>
                    <Button variant="outline" size="sm" className="text-xs h-8 bg-gray-100">Week</Button>
                    <Button variant="outline" size="sm" className="text-xs h-8">Month</Button>
                  </div>
                </div>
                
                <Card className="border-0 shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Delivery</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead>Shipping</TableHead>
                        <TableHead>Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders?.slice(0, 5).map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            {products?.find(p => p.id === order.id)?.name || `Product ${order.id}`}
                          </TableCell>
                          <TableCell>Customer {order.id}</TableCell>
                          <TableCell>
                            <Badge className={
                              order.status === "completed" ? "bg-green-100 text-green-800 hover:bg-green-100" : 
                              order.status === "processing" ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" : 
                              "bg-blue-100 text-blue-800 hover:bg-blue-100"
                            }>
                              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>${(order.total * 0.9).toFixed(2)}</TableCell>
                          <TableCell>${(order.total * 0.1).toFixed(2)}</TableCell>
                          <TableCell className="font-medium">${order.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      {(!orders || orders.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">No orders found</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </Card>
              </div>
            </div>
          )}
          
          {/* Products Tab */}
          {activeTab === 'products' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Manage Products</h2>
                <Button onClick={openNewProductDialog} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  <span>Add Product</span>
                </Button>
              </div>
              
              {productsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Card className="border-0 shadow-sm">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products?.map((product) => (
                          <TableRow key={product.id}>
                            <TableCell>{product.id}</TableCell>
                            <TableCell className="font-medium">{product.name}</TableCell>
                            <TableCell>${product.price.toFixed(2)}</TableCell>
                            <TableCell>
                              {categories?.find(c => c.id === product.categoryId)?.name || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              {product.inStock ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Stock</Badge>
                              ) : (
                                <Badge variant="destructive">Out of Stock</Badge>
                              )}
                              {product.isNew && <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100">New</Badge>}
                              {product.isSale && <Badge className="ml-2 bg-orange-100 text-orange-800 hover:bg-orange-100">Sale</Badge>}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => openEditProductDialog(product)}
                                className="mr-2"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteProduct(product.id)}
                                className="text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}
            </div>
          )}
          
          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Manage Orders</h2>
              
              {ordersLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Card className="border-0 shadow-sm">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>User ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders?.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>{order.id}</TableCell>
                            <TableCell>{order.userId}</TableCell>
                            <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                            <TableCell>${order.total.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  order.status === "completed"
                                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                                    : order.status === "processing"
                                    ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                    : order.status === "cancelled"
                                    ? "bg-red-100 text-red-800 hover:bg-red-100"
                                    : "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                }
                              >
                                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Select
                                defaultValue={order.status}
                                onValueChange={(value) => handleOrderStatusUpdate(order.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="processing">Processing</SelectItem>
                                  <SelectItem value="completed">Completed</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}
            </div>
          )}
          
          {/* Categories Tab */}
          {activeTab === 'categories' && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Manage Categories</h2>
              
              {categoriesLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories?.map((category) => (
                    <Card key={category.id} className="border-0 shadow-sm">
                      <CardHeader>
                        <CardTitle>{category.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Slug: {category.slug}</p>
                        <p className="mt-2">
                          {products?.filter(p => p.categoryId === category.id).length || 0} products
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Product Form Dialog */}
      <Dialog open={productFormOpen} onOpenChange={setProductFormOpen}>
        <DialogContent className="max-w-md max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingProduct ? "Edit Product" : "Add New Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Make changes to the product details below."
                : "Fill in the product details below to add a new product."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleProductFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={productForm.name}
                  onChange={handleProductFormChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  name="shortDescription"
                  value={productForm.shortDescription}
                  onChange={handleProductFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Full Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={productForm.description}
                  onChange={handleProductFormChange}
                  rows={3}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    value={productForm.price}
                    onChange={handleProductFormChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    name="brand"
                    value={productForm.brand}
                    onChange={handleProductFormChange}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  value={productForm.imageUrl}
                  onChange={handleProductFormChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category</Label>
                <Select
                  value={productForm.categoryId.toString() || undefined}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating (0-5)</Label>
                  <Input
                    id="rating"
                    name="rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={productForm.rating}
                    onChange={handleProductFormChange}
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="inStock"
                    checked={productForm.inStock}
                    onCheckedChange={(checked) => handleSwitchChange("inStock", checked)}
                  />
                  <Label htmlFor="inStock">In Stock</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isNew"
                    checked={productForm.isNew}
                    onCheckedChange={(checked) => handleSwitchChange("isNew", checked)}
                  />
                  <Label htmlFor="isNew">Mark as New</Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isSale"
                    checked={productForm.isSale}
                    onCheckedChange={(checked) => handleSwitchChange("isSale", checked)}
                  />
                  <Label htmlFor="isSale">On Sale</Label>
                </div>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setProductFormOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createProductMutation.isPending || updateProductMutation.isPending}
              >
                {editingProduct ? "Update Product" : "Add Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}