import React, { useEffect, useState } from 'react';
import useAuthStore from '../stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ProductDialog from '../components/ui/products/ProductDialog'; 
import { DollarSign, Package, ShoppingCart, BookOpen, Video, Loader } from 'lucide-react'; // ✅ ADDED Video, Loader
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); 
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/api/artisans/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch dashboard data.');
      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleAddNewProduct = () => {
    setEditingProduct(null); 
    setIsProductDialogOpen(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setIsProductDialogOpen(true);
  };
  
  const handleSaveProduct = async (productData) => {
    const isEditing = !!productData._id;
    const url = isEditing ? `http://localhost:8000/api/products/${productData._id}` : 'http://localhost:8000/api/products';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(productData),
      });
      if (!response.ok) throw new Error('Failed to save product.');
      setIsProductDialogOpen(false);
      fetchData(); 
    } catch (err) {
      alert(err.message);
    }
  };
  
  const handleDeleteConfirmation = (product) => {
    setProductToDelete(product);
    setIsAlertOpen(true);
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      const response = await fetch(`http://localhost:8000/api/products/${productToDelete._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete product.');
      setIsAlertOpen(false);
      setProductToDelete(null);
      fetchData(); 
    } catch (err) {
      alert(err.message);
    }
  };

  // ✅ NEW: Regenerate video handler
  const handleRegenerateVideo = async (productId) => {
    if (!confirm('Regenerate marketing video? This will take 2-5 minutes.')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/api/products/${productId}/regenerate-video`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Video regeneration started! Check back in 2-5 minutes.');
        fetchData(); // Refresh to show "generating" status
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error('Video regeneration error:', error);
      alert('Failed to regenerate video: ' + error.message);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!dashboardData) return <div>No data found.</div>;

  const { profile, products } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left">Welcome, {profile.storeName}!</h1>
                    <p className="text-muted-foreground text-center md:text-left">Here's your store's overview.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    <Button variant="outline" onClick={() => navigate(`/store/${profile._id}`)}>View Public Store</Button>
                    <Button onClick={handleAddNewProduct}>+ Add New Product</Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Revenue</CardTitle><DollarSign className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">₹{dashboardData.totalRevenue?.toFixed(2) || '0.00'}</div><p className="text-xs text-muted-foreground">Calculated from completed orders</p></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Orders</CardTitle><ShoppingCart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{dashboardData.totalOrders || 0}</div><p className="text-xs text-muted-foreground">New orders will appear here</p></CardContent></Card>
                <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Products Listed</CardTitle><Package className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{products.length}</div><p className="text-xs text-muted-foreground">Total products in your store</p></CardContent></Card>
            </div>

            {/* Stories Card */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        My Stories
                    </CardTitle>
                    <CardDescription>
                        Share the narrative behind your craft, announce new collections, or write about your process to connect with customers.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => navigate('/dashboard/stories')}>Manage Stories</Button>
                </CardContent>
            </Card>

            {/* ✅ ENHANCED: Products Table with Video Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Products</CardTitle>
                    <CardDescription>Manage your inventory and product details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="hidden md:table-cell">Image</TableHead>
                                <TableHead>Product</TableHead>
                                <TableHead>Price</TableHead>
                                <TableHead className="hidden md:table-cell">Inventory</TableHead>
                                {/* ✅ NEW: Video Status Column */}
                                <TableHead className="hidden lg:table-cell">Marketing Video</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product._id}>
                                    <TableCell className="hidden md:table-cell">
                                        <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                                            <img src={product.imageURLs[0]} alt={product.title} className="w-full h-full object-cover" />
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-medium">{product.title}</TableCell>
                                    <TableCell>₹{product.price}</TableCell>
                                    <TableCell className="hidden md:table-cell">{product.stockQuantity}</TableCell>
                                    
                                    {/* ✅ NEW: Video Status Cell */}
                                    <TableCell className="hidden lg:table-cell">
                                        {product.videoStatus === 'completed' && product.marketingVideo?.url && (
                                            <div className="flex items-center gap-2">
                                                <a 
                                                    href={product.marketingVideo.url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                                                >
                                                    <Video className="w-4 h-4" />
                                                    View
                                                </a>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRegenerateVideo(product._id)}
                                                    className="text-xs h-6 px-2"
                                                >
                                                    Regenerate
                                                </Button>
                                            </div>
                                        )}
                                        {product.videoStatus === 'generating' && (
                                            <span className="text-xs text-blue-600 flex items-center gap-1">
                                                <Loader className="w-3 h-3 animate-spin" />
                                                Generating...
                                            </span>
                                        )}
                                        {product.videoStatus === 'failed' && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-red-600">Failed</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRegenerateVideo(product._id)}
                                                    className="text-xs h-6 px-2"
                                                >
                                                    Retry
                                                </Button>
                                            </div>
                                        )}
                                        {product.videoStatus === 'not_generated' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleRegenerateVideo(product._id)}
                                                className="text-xs h-6 px-2"
                                            >
                                                Generate Video
                                            </Button>
                                        )}
                                    </TableCell>
                                    
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleEditProduct(product)}>Edit</Button>
                                        <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDeleteConfirmation(product)}>Delete</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <ProductDialog 
                open={isProductDialogOpen}
                onOpenChange={setIsProductDialogOpen}
                product={editingProduct}
                onSave={handleSaveProduct}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the product "{productToDelete?.title}". This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteProduct}>Yes, Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    </div>
  );
}