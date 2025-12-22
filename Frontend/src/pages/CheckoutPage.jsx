import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { getApiUrl } from "@/lib/api";
import Spinner from '@/components/ui/Spinner';
import { useTranslation } from '@/hooks/useTranslation';

export default function CheckoutPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [product, setProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState('');
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    phoneNumber: ''
  });

  const productId = searchParams.get('productId');
  const initialQty = Number(searchParams.get('qty')) || 1;
  const [quantity, setQuantity] = useState(initialQty);

  // Autofill shipping address from user data
  useEffect(() => {
    if (user) {
      setShippingAddress({
        street: user.address?.street || '',
        city: user.address?.city || '',
        state: user.address?.state || '',
        postalCode: user.address?.postalCode || '',
        phoneNumber: user.phoneNumber || ''
      });
    }
  }, [user]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProductDetails = async () => {
      if (!productId) {
        setError(t('checkoutPage.noProduct'));
        setLoadingProduct(false);
        return;
      }
      try {
        const res = await fetch(getApiUrl(`/api/products/${productId}`));
        if (!res.ok) throw new Error(t('checkoutPage.productNotFound'));
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProductDetails();
  }, [productId]);

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
    setShippingAddress(prev => ({ ...prev, [id]: value }));
  };

  const handlePayment = async () => {
    console.log('My Razorpay Key ID is:', import.meta.env.VITE_RAZORPAY_KEY_ID);
    if (Object.values(shippingAddress).some(field => field.trim() === '')) {
      alert(t('checkoutPage.fillAllFields'));
      return;
    }
    if (!user) {
      alert(t('checkoutPage.loginRequired'));
      return;
    }

    setPaymentLoading(true);

    try {
      const createOrderRes = await fetch(getApiUrl('/api/orders/create-order'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, qty: quantity }),
      });

      if (!createOrderRes.ok) throw new Error(t('checkoutPage.createOrderFailed'));
      const orderData = await createOrderRes.json();
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'KarigarMart',
        description: `Payment for ${orderData.productName}`,
        order_id: orderData.id,
        handler: async function (response) {
          const dataToVerify = {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            orderItems: [{
              product: product._id,
              name: product.title,
              image: product.imageURLs?.[0],
              price: product.price,
              qty: quantity,
            }],
            shippingAddress: { ...shippingAddress, country: 'India' },
            totalPrice: product.price * quantity,
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
            alert(t('checkoutPage.paymentFailed'));
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

  if (loadingProduct) return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
  if (error) return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <AlertTriangle className="h-10 w-10 text-red-500" />
      <p className="text-center text-red-600 font-medium">{t('checkoutPage.error')}: {error}</p>
      <Link to="/shop"><Button variant="outline">{t('checkoutPage.backToShop')}</Button></Link>
    </div>
  );
  if (!product) return null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-center mb-10">{t('checkoutPage.secureCheckout')}</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          <Card>
            <CardHeader><CardTitle>{t('checkoutPage.shippingAddress')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="street">{t('checkoutPage.street')}</Label>
                <Input id="street" value={shippingAddress.street} onChange={handleInputChange} placeholder={t('checkoutPage.streetPlaceholder')} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label htmlFor="city">{t('checkoutPage.city')}</Label><Input id="city" value={shippingAddress.city} onChange={handleInputChange} placeholder={t('checkoutPage.cityPlaceholder')} /></div>
                <div><Label htmlFor="state">{t('checkoutPage.state')}</Label><Input id="state" value={shippingAddress.state} onChange={handleInputChange} placeholder={t('checkoutPage.statePlaceholder')} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label htmlFor="postalCode">{t('checkoutPage.postalCode')}</Label><Input id="postalCode" value={shippingAddress.postalCode} onChange={handleInputChange} placeholder={t('checkoutPage.postalCodePlaceholder')} /></div>
                <div><Label htmlFor="phoneNumber">{t('checkoutPage.phoneNumber')}</Label><Input id="phoneNumber" type="tel" value={shippingAddress.phoneNumber} onChange={handleInputChange} placeholder={t('checkoutPage.phonePlaceholder')} /></div>
              </div>
            </CardContent>
          </Card>


          <div className="lg:sticky top-24">
            <Card>
              <CardHeader><CardTitle>{t('checkoutPage.orderSummary')}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img src={product.imageURLs?.[0]} alt={product.title} className="w-20 h-20 object-cover rounded-md" />
                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">{quantity}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.title}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-sm text-muted-foreground">{t('checkoutPage.quantity')}</span>
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-2 py-1 border rounded hover:bg-gray-100 text-sm"
                      >
                        −
                      </button>
                      <span className="font-semibold w-6 text-center">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                        className="px-2 py-1 border rounded hover:bg-gray-100 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <p className="ml-auto font-semibold">₹{(product.price * quantity).toFixed(2)}</p>
                </div>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('checkoutPage.subtotal')}</span><span>₹{(product.price * quantity).toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t('checkoutPage.shipping')}</span><span className="font-semibold text-green-600">{t('checkoutPage.freeShipping')}</span></div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold text-lg"><span>{t('checkoutPage.total')}</span><span>₹{(product.price * quantity).toFixed(2)}</span></div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handlePayment} className="w-full" size="lg" disabled={paymentLoading}>
                  {paymentLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('checkoutPage.proceedToPayment')}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}