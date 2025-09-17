import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useCartStore from '@/stores/cartStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { X, Plus, Minus, Truck, Shield, RefreshCw, Tag, AlertTriangle } from 'lucide-react';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, removeFromCart, subtotal, updateItemQuantity, clearCart } = useCartStore();
  const [note, setNote] = useState('');
  const totalItems = useMemo(() => (items || []).reduce((n, { quantity }) => n + (quantity || 0), 0), [items]);
  const sub = useMemo(() => Number(subtotal?.() ?? 0), [subtotal , items]);
  const freeShipThreshold = 999; 
  const freeShipRemaining = Math.max(0, freeShipThreshold - sub);
  const freeShipProgress = Math.min(100, Math.round((sub / freeShipThreshold) * 100));

  const isCartValid = useMemo(() => {
    if (!items || items.length === 0) return false;
    // The cart is invalid if even one item's quantity is greater than its available stock.
    return !items.some(({ product, quantity }) => quantity > product.stockQuantity);
  }, [items]);

  const checkoutSubtotal = useMemo(() => {
    const validItems = items.filter(({ product, quantity }) => quantity <= product.stockQuantity);
    return validItems.reduce((acc, { product, quantity }) => acc + product.price * quantity, 0);
  }, [items]);

  function handleDecrease(productId, quantity) {
    if (typeof updateItemQuantity !== 'function') return;
    const next = Math.max(1, (quantity || 1) - 1);
    updateItemQuantity(productId, next);
  }

  function handleIncrease(productId, quantity, stockQuantity) {
    if (typeof updateItemQuantity !== 'function') return;
    const limit = typeof stockQuantity === 'number' ? stockQuantity : 99;
    const next = Math.min(limit, (quantity || 1) + 1);
    updateItemQuantity(productId, next);
  }

  if (!items || items.length === 0) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">My Shopping Cart</h1>
        </div>
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">Your Cart is Empty</h2>
          <p className="text-muted-foreground mt-2">Time to fill it up with some amazing crafts!</p>
          <Link to="/shop">
            <Button className="mt-6">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">My Shopping Cart</h1>
        <p className="text-sm text-muted-foreground mt-1">{totalItems} item{totalItems !== 1 ? 's' : ''}</p>
      </div>

      {!isCartValid && (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-destructive bg-destructive/10 p-3 text-destructive">
          <AlertTriangle className="h-5 w-5" />
          <p className="text-sm font-semibold">
            Some items in your cart are out of stock. Please remove them to proceed.
          </p>
        </div>
      )}

      {/* Free shipping banner */}
      <div className="mb-8 rounded-lg border p-4 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            {freeShipRemaining > 0 ? (
              <span className="text-sm">
                You’re <span className="font-semibold">₹{freeShipRemaining.toFixed(0)}</span> away from free shipping
              </span>
            ) : (
              <span className="text-sm font-semibold">You’ve unlocked free shipping!</span>
            )}
          </div>
          <div className="w-full sm:w-72 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${freeShipProgress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => {
            const image = product?.imageURLs?.[0];
            const lineTotal = Number(product?.price || 0) * Number(quantity || 0);
            const canDec = typeof updateItemQuantity === 'function' ? quantity > 1 : false;
            const canInc = typeof updateItemQuantity === 'function'
              ? (typeof product?.stockQuantity === 'number' ? quantity < product.stockQuantity : true)
              : false;
            const isItemInStock = product.stockQuantity > 0;
            const isQuantityAvailable = quantity <= product.stockQuantity;

            return (
              <Card key={product?._id} className={`flex items-center p-4 transition-colors ${!isQuantityAvailable ? 'border-destructive bg-destructive/5' : ''}`}>
                <Link to={`/products/${product._id}`} className="shrink-0">
                  <div className="relative w-24 h-24 rounded-md overflow-hidden bg-gray-100 border">
                      {image ? (
                          <img src={image} alt={product?.title} className="w-full h-full object-cover" />
                      ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
                      )}
                  </div>
                </Link>

                <div className="ml-4 flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/products/${product._id}`} className="shrink-0">
                        <h3 className="font-semibold line-clamp-2">{product?.title}</h3>
                      </Link>
                        
                        {!isQuantityAvailable && isItemInStock && (
                            <p className="text-sm text-destructive mt-1 font-medium">Only {product.stockQuantity} left in stock</p>
                        )}
                        {!isItemInStock && (
                            <p className="text-sm text-destructive mt-1 font-medium">Out of stock</p>
                        )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold">₹{Number(product?.price || 0).toFixed(2)}</div>
                      <div className="text-xs text-muted-foreground mt-1">each</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    {/* Quantity controls */}
                    <div className="flex items-center border rounded-md">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDecrease(product?._id, quantity)}
                        disabled={!canDec}
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center font-semibold">{quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleIncrease(product?._id, quantity, product?.stockQuantity)}
                        disabled={!canInc}
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Line total */}
                    <div className="text-right ml-auto sm:ml-0">
                      <div className="text-sm text-muted-foreground">Item total</div>
                      <div className="text-base font-semibold">₹{lineTotal.toFixed(2)}</div>
                    </div>

                    {/* Remove */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart?.(product?._id)}
                      aria-label="Remove item"
                      className="ml-auto"
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          {/* Cart actions row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link to="/shop">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
            {typeof clearCart === 'function' && (
              <Button variant="ghost" onClick={() => clearCart()} className="text-red-600">
                Clear Cart
              </Button>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="lg:sticky top-24">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 bg-muted/40 rounded-md p-3">
                <Shield className="h-4 w-4 text-primary" />
                <span className="text-sm">Secure checkout and encrypted payments</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">₹{checkoutSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Shipping</span>
                <span>{checkoutSubtotal >= freeShipThreshold ? 'Free' : 'Calculated at next step'}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{checkoutSubtotal.toFixed(2)}</span>
              </div>

              {/* Optional note to seller */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  Order note (optional)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-md border bg-background p-2 text-sm"
                  placeholder="Add any special instructions for your order…"
                  rows={3}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
                <Button
                    size="lg"
                    className="w-full"
                    disabled={!isCartValid}
                    onClick={() => navigate('/checkout-cart')}
                    >
                    Proceed to Checkout
                </Button>
              <div className="grid grid-cols-3 gap-2 w-full text-xs text-muted-foreground">
                <div className="flex items-center gap-2 border rounded-md p-2">
                  <Truck className="h-4 w-4 text-primary" />
                  Fast shipping
                </div>
                <div className="flex items-center gap-2 border rounded-md p-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Buyer protection
                </div>
                <div className="flex items-center gap-2 border rounded-md p-2">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  Easy returns
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}