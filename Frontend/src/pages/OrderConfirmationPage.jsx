import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { getApiUrl } from '@/lib/api';
import { useTranslation } from '@/hooks/useTranslation';

export default function OrderConfirmationPage() {
  const { t } = useTranslation();
  const { orderId } = useParams();
  const token = useAuthStore((state) => state.token);
  const fetchUserProfile = useAuthStore((state) => state.fetchUserProfile);
  
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchOrder = async () => {
      try {
        const res = await fetch(getApiUrl(`/api/orders/${orderId}`), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) throw new Error(t('orderConfirmation.fetchFailed'));
        const data = await res.json();
        setOrder(data);
        
        // Refresh user profile to get updated address
        if (token) {
          await fetchUserProfile();
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (orderId && token) {
      fetchOrder();
    }
  }, [orderId, token, fetchUserProfile]);

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <p className="text-center text-red-600 font-medium">{t('orderConfirmation.error', {error})}</p>
        <Link to="/shop"><Button variant="outline">{t('orderConfirmation.backToShop')}</Button></Link>
      </div>
  );
  if (!order) return null;

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center bg-green-50">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">{t('orderConfirmation.thankYou')}</h1>
            <p className="text-muted-foreground">{t('orderConfirmation.successMessage')}</p>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">{t('orderConfirmation.orderId')}</p>
              <p className="font-mono text-lg">{order._id}</p>
            </div>
            
            <Separator />
            
            <h3 className="font-semibold">{t('orderConfirmation.orderSummary')}</h3>
            {order.orderItems.map((item) => (
              <div key={item.product} className="flex items-center space-x-4">
                <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-md" />
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{t('orderConfirmation.qty', { count: item.qty })}</p>
                </div>
                <p className="ml-auto font-semibold">₹{(item.price * item.qty).toFixed(2)}</p>
              </div>
            ))}

            <Separator />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">{t('orderConfirmation.shipping')}</h3>
                <address className="not-italic text-muted-foreground">
                  {order.shippingAddress.street}<br />
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
                  {order.shippingAddress.country}<br/>
                  {t('orderConfirmation.phone')}: {order.shippingAddress.phoneNumber}
                </address>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{t('orderConfirmation.totalAmount')}</h3>
                <p className="text-2xl font-bold">₹{order.totalPrice.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">{t('orderConfirmation.paidVia', {method : order.paymentMethod})}</p>
              </div>
            </div>

            <Separator />

            <div className="text-center pt-4">
              <Link to="/shop">
                <Button>{t('orderConfirmation.continueShopping')}</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}