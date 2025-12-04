import React, { useState, useEffect } from 'react';
import { useNavigate , Link} from 'react-router-dom';
import  useAuthStore from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import useCartStore from '@/stores/cartStore';
import { getApiUrl } from '@/lib/api';

export default function CheckoutCartPage() {
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const { items: cartItems, subtotal } = useCartStore();
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [error, setError] = useState('');
    const [shippingAddress, setShippingAddress] = useState({
        street: '',
        city: '',
        state: '',
        postalCode: '',
        phoneNumber: ''
    });

    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);

        return () => {
        document.body.removeChild(script);
        };
    }, []);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setShippingAddress(prev => ({...prev, [id]: value}));
    };

    const handlePayment = async () => {
        if (Object.values(shippingAddress).some(field => field.trim() === '')) {
            alert('Please fill out all shipping fields.');
            return;
        }
        if (!user) {
            alert('You must be logged in to make a purchase.');
            return;
        }

        setPaymentLoading(true);

        try {
            const createOrderRes = await fetch(getApiUrl('/api/orders/create-cart-order'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({}), // Body can be empty, backend reads from DB
            });

            if (!createOrderRes.ok) throw new Error('Failed to create payment order.');
            const orderData = await createOrderRes.json();
            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'Karigar-Mart',
                description: `Payment for ${cartItems.length} items`,
                order_id: orderData.id,
                handler: async function (response) {
                const dataToVerify = {
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    orderItems: cartItems.map(item => ({
                        product: item.product._id,
                        name: item.product.title,
                        image: item.product.imageURLs[0],
                        price: item.product.price,
                        qty: item.quantity,
                    })),
                    shippingAddress: { ...shippingAddress, country: 'India' },
                    totalPrice: subtotal(),
                };

            const verifyRes = await fetch(getApiUrl('/api/orders/verify-payment'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, 
                body: JSON.stringify(dataToVerify),
            });

            const verifyData = await verifyRes.json();
                if (verifyData.success) {
                    navigate(`/order-confirmation/${verifyData.orderId}`);
                } else {
                    alert('Payment verification failed. Please contact support.');
                }
            },
            prefill: {
                name: `${user.firstName} ${user.lastName}`, 
                email: user.email,                           
                contact: shippingAddress.phoneNumber,
            },
            theme: { color: '#0f172a' },
            modal: {
                ondismiss: function () {
                console.log('Payment modal was closed.');
                setPaymentLoading(false);
                },
            },
        };

        const rzpInstance = new window.Razorpay(options);
        rzpInstance.on('payment.failed', function (response) {
            alert(response.error.description);
            setPaymentLoading(false);
        });
        rzpInstance.open();

        } catch (err) {
        setError(err.message || 'An error occurred during payment.');
        setPaymentLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="container mx-auto p-4 py-12">
                <h1 className="text-3xl font-bold tracking-tight text-center mb-10">Secure Checkout</h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
                
                    <Card>
                        <CardHeader><CardTitle>1. Shipping Address</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="street">Street Address</Label>
                                <Input id="street" value={shippingAddress.street} onChange={handleInputChange} placeholder="123 Art Lane" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><Label htmlFor="city">City</Label><Input id="city" value={shippingAddress.city} onChange={handleInputChange} placeholder="Mumbai" /></div>
                                <div><Label htmlFor="state">State</Label><Input id="state" value={shippingAddress.state} onChange={handleInputChange} placeholder="Maharashtra" /></div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div><Label htmlFor="postalCode">Postal Code</Label><Input id="postalCode" value={shippingAddress.postalCode} onChange={handleInputChange} placeholder="400001" /></div>
                                <div><Label htmlFor="phoneNumber">Phone Number</Label><Input id="phoneNumber" type="tel" value={shippingAddress.phoneNumber} onChange={handleInputChange} placeholder="9876543210" /></div>
                            </div>
                        </CardContent>
                    </Card>

                
                    <div className="lg:sticky top-24">
                        <Card>
                            <CardHeader><CardTitle>2. Order Summary</CardTitle></CardHeader>
                            <CardContent>
                                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                    {cartItems.map(item => (
                                        <div key={item.product._id} className="flex items-center space-x-4">
                                            <div className="relative">
                                                <img src={item.product.imageURLs[0]} alt={item.product.title} className="w-16 h-16 object-cover rounded-md" />
                                                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">{item.quantity}</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-sm line-clamp-1">{item.product.title}</h3>
                                                <p className="text-sm text-muted-foreground">₹{item.product.price.toFixed(2)}</p>
                                            </div>
                                            <p className="ml-auto font-semibold">₹{(item.product.price * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>

                                <Separator className="my-4" />
                                <div className="space-y-2">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{subtotal().toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="font-semibold text-green-600">FREE</span></div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between font-bold text-lg"><span>Total</span><span>₹{subtotal().toFixed(2)}</span></div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handlePayment} className="w-full" size="lg" disabled={paymentLoading}>
                                    {paymentLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Proceed to Payment
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}