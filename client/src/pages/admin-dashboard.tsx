import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Redirect } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Product, Category, Order } from "@shared/schema";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
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
import { AlertCircle, CheckCircle, Edit, Plus, Trash2, Package, ShoppingCart, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  const [activeTab, setActiveTab] = useState("products");
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
    enabled: !!user?.isAdmin && activeTab === "orders"
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
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect if not admin
  if (!authLoading && (!user || !user.isAdmin)) {
    return <Redirect to="/" />;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md mb-8">
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span>Products</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" />
            <span>Orders</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span>Categories</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Products Tab */}
        <TabsContent value="products">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Manage Products</h2>
            <Button onClick={openNewProductDialog} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Product</span>
            </Button>
          </div>
          
          {productsLoading ? (
            <p>Loading products...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>List of all products in the store</TableCaption>
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
                          <Badge className="bg-green-500">In Stock</Badge>
                        ) : (
                          <Badge variant="destructive">Out of Stock</Badge>
                        )}
                        {product.isNew && <Badge className="ml-2 bg-blue-500">New</Badge>}
                        {product.isSale && <Badge className="ml-2 bg-orange-500">Sale</Badge>}
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
          )}
        </TabsContent>
        
        {/* Orders Tab */}
        <TabsContent value="orders">
          <h2 className="text-2xl font-bold mb-4">Manage Orders</h2>
          
          {ordersLoading ? (
            <p>Loading orders...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableCaption>List of all customer orders</TableCaption>
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
                              ? "bg-green-500"
                              : order.status === "processing"
                              ? "bg-blue-500"
                              : order.status === "cancelled"
                              ? "bg-red-500"
                              : "bg-yellow-500"
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
          )}
        </TabsContent>
        
        {/* Categories Tab */}
        <TabsContent value="categories">
          <h2 className="text-2xl font-bold mb-4">Manage Categories</h2>
          
          {categoriesLoading ? (
            <p>Loading categories...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories?.map((category) => (
                <Card key={category.id}>
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
        </TabsContent>
      </Tabs>
      
      {/* Product Form Dialog */}
      <Dialog open={productFormOpen} onOpenChange={setProductFormOpen}>
        <DialogContent className="max-w-md">
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
                  rows={4}
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
              
              <div className="flex flex-col gap-4 pt-2">
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
            
            <DialogFooter>
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