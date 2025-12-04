import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, AlertTriangle, PackageSearch, Search, Filter, ArrowUpDown, Copy, Check, Download, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getApiUrl } from '@/lib/api';

const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const formatINR = (amount) => {
  const n = Number(amount || 0);
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n);
  } catch {
    return `₹${n.toFixed(2)}`;
  }
};

export default function MyOrdersPage() {
  const token = useAuthStore((state) => state.token);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all | delivered | processing
  const [sortBy, setSortBy] = useState('date_desc'); // date_desc | date_asc | total_desc | total_asc
  const [copiedId, setCopiedId] = useState('');
  const [downloadingCsv, setDownloadingCsv] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        const response = await fetch(getApiUrl('/api/orders/myorders'), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('Failed to fetch orders.');
        const data = await response.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || 'Failed to fetch orders.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token]);

  const deliveredCount = useMemo(() => orders.filter((o) => !!o.isDelivered).length, [orders]);
  const totalSpent = useMemo(
    () => orders.reduce((sum, o) => sum + Number(o?.totalPrice || 0), 0),
    [orders]
  );

  const processed = useMemo(() => {
    let list = [...orders];

    // Filter by status
    if (filterStatus === 'delivered') {
      list = list.filter((o) => !!o.isDelivered);
    } else if (filterStatus === 'processing') {
      list = list.filter((o) => !o.isDelivered);
    }

    // Query on id or item names
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((o) => {
        const inId = String(o?._id || '').toLowerCase().includes(q);
        const inItems = Array.isArray(o?.orderItems)
          ? o.orderItems.some((it) => String(it?.name || '').toLowerCase().includes(q))
          : false;
        return inId || inItems;
      });
    }

    // Sort
    list.sort((a, b) => {
      const aDate = new Date(a?.createdAt || 0).getTime();
      const bDate = new Date(b?.createdAt || 0).getTime();
      const aTotal = Number(a?.totalPrice || 0);
      const bTotal = Number(b?.totalPrice || 0);
      switch (sortBy) {
        case 'date_asc':
          return aDate - bDate;
        case 'total_desc':
          return bTotal - aTotal;
        case 'total_asc':
          return aTotal - bTotal;
        case 'date_desc':
        default:
          return bDate - aDate;
      }
    });

    return list;
  }, [orders, filterStatus, query, sortBy]);

  // Copy order id
  async function handleCopy(id) {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 1200);
    } catch {
      // ignore
    }
  }

  // Export CSV (client-side)
  function exportCSV() {
    try {
      setDownloadingCsv(true);
      const headers = [
        'Order ID',
        'Date',
        'Total',
        'Delivered',
        'Items Count',
        'Shipping City',
        'Shipping State',
        'Shipping Postal',
      ];
      const rows = processed.map((o) => [
        o?._id || '',
        formatDate(o?.createdAt || ''),
        Number(o?.totalPrice || 0),
        o?.isDelivered ? 'Yes' : 'No',
        Array.isArray(o?.orderItems) ? o.orderItems.reduce((n, it) => n + Number(it?.qty || 0), 0) : 0,
        o?.shippingAddress?.city || '',
        o?.shippingAddress?.state || '',
        o?.shippingAddress?.postalCode || '',
      ]);

      const csv = [headers, ...rows]
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-orders.csv';
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingCsv(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <p className="text-center text-red-600 font-medium">Error: {error}</p>
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <PackageSearch className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">No Orders Yet</h1>
        <p className="text-muted-foreground mt-2">You haven&apos;t placed any orders with us. Let&apos;s change that!</p>
        <Link to="/shop">
          <Button className="mt-6">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-4">
        <h1 className="text-3xl font-bold tracking-tight">My Orders</h1>
        <p className="text-muted-foreground">View your order history and details.</p>
      </div>

      {/* Summary stats */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total Orders</div>
          <div className="text-2xl font-bold">{orders.length}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Delivered</div>
          <div className="text-2xl font-bold">{deliveredCount}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-muted-foreground">Total Spent</div>
          <div className="text-2xl font-bold">{formatINR(totalSpent)}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-md border px-3 py-2 bg-background">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Order ID or item name"
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border px-2 py-1.5 bg-background">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              className="bg-transparent text-sm outline-none"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Filter orders"
            >
              <option value="all">All</option>
              <option value="delivered">Delivered</option>
              <option value="processing">Processing</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-md border px-2 py-1.5 bg-background">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              className="bg-transparent text-sm outline-none"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort orders"
            >
              <option value="date_desc">Newest first</option>
              <option value="date_asc">Oldest first</option>
              <option value="total_desc">Total: High to Low</option>
              <option value="total_asc">Total: Low to High</option>
            </select>
          </div>

          <Button variant="outline" className="gap-2" onClick={exportCSV} disabled={!processed.length || downloadingCsv}>
            {downloadingCsv ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </Button>
        </div>
      </div>

      {/* Orders list */}
      <Card>
        <CardContent className="p-0">
          <Accordion type="single" collapsible className="w-full">
            {processed.map((order) => {
              const total = Number(order?.totalPrice || 0);
              const itemsCount = Array.isArray(order?.orderItems)
                ? order.orderItems.reduce((n, it) => n + Number(it?.qty || 0), 0)
                : 0;

              return (
                <AccordionItem value={order._id} key={order._id}>
                  <AccordionTrigger className="px-6 py-4 hover:bg-muted/50">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-left w-full">
                      <div className="flex-1 min-w-[160px]">
                        <div className="text-xs text-muted-foreground">Order ID</div>
                        <div className="font-mono break-all flex items-center gap-2">
                          <span>{order._id}</span>
                          <span
                            role="button"
                            tabIndex={0}
                            className="p-1 rounded hover:bg-muted/70 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              handleCopy(order._id);
                            }}
                            aria-label="Copy order id"
                            title="Copy Order ID"
                          >
                            {copiedId === order._id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <div className="text-xs text-muted-foreground">Date</div>
                        <div>{formatDate(order.createdAt)}</div>
                      </div>
                      <div className="flex-1 min-w-[100px]">
                        <div className="text-xs text-muted-foreground">Total</div>
                        <div className="font-semibold">{formatINR(total)}</div>
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <div className="text-xs text-muted-foreground">Items</div>
                        <div>{itemsCount}</div>
                      </div>
                      <div className="flex-1 min-w-[120px]">
                        <div className="text-xs text-muted-foreground">Status</div>
                        <div className="flex items-center gap-2">
                          <Badge variant={order.isDelivered ? 'default' : 'secondary'}>
                            {order.isDelivered ? 'Delivered' : 'Processing'}
                          </Badge>
                          {order.isDelivered && order.deliveredAt && (
                            <span className="text-xs text-muted-foreground">on {formatDate(order.deliveredAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-6 py-5 border-t bg-muted/20">
                    {/* Items */}
                    <h4 className="font-semibold mb-3">Order Items</h4>
                    <div className="space-y-4">
                      {Array.isArray(order.orderItems) && order.orderItems.map((item) => (
                        <div key={item._id} className="flex gap-4">
                          <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100 border">
                            {item.image ? (
                              <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">No image</div>
                            )}
                          </div>
                          <div className="flex-grow min-w-0">
                            <p className="font-medium truncate">{item.name}</p>
                            <p className="text-sm text-muted-foreground">Qty: {item.qty}</p>
                          </div>
                          <p className="text-sm font-medium">{formatINR(item.price)}</p>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    {/* Shipping */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <h4 className="font-semibold mb-2">Shipping Address</h4>
                        <address className="not-italic text-sm text-muted-foreground">
                          {order?.shippingAddress?.street}<br />
                          {order?.shippingAddress?.city}, {order?.shippingAddress?.state} {order?.shippingAddress?.postalCode}
                        </address>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold mb-2">Payment</h4>
                        <div className="text-sm text-muted-foreground">
                          {order?.isPaid ? (
                            <>Paid on {formatDate(order?.paidAt)}</>
                          ) : (
                            <>Payment pending</>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => {
                              // If your API returns invoiceUrl, open it; else no-op
                              if (order?.invoiceUrl) window.open(order.invoiceUrl, '_blank', 'noopener,noreferrer');
                            }}
                            disabled={!order?.invoiceUrl}
                            title={order?.invoiceUrl ? 'View Invoice' : 'Invoice not available'}
                          >
                            <FileText className="h-4 w-4" />
                            Invoice
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-2"
                            onClick={() => {
                              // Simple reorder helper (navigate to shop)
                              window.location.href = '/shop';
                            }}
                          >
                            Reorder
                          </Button>
                        </div>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}