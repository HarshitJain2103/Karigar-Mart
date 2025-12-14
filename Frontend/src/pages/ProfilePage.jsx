import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Heart, ShoppingBag, LogOut, Camera, Edit2, Save, X, MapPin, Package, Loader2, AlertTriangle, Eye, EyeOff } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import useAuthStore from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { getApiUrl } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import { useTranslation } from "@/hooks/useTranslation";

export default function ProfilePage() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const fetchUserProfile = useAuthStore((state) => state.fetchUserProfile);
    const setUser = useAuthStore((state) => state.setUser);

    const avatarInputRef = useRef(null);

    const [activeSection, setActiveSection] = useState("overview");
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [orders, setOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [wishlist, setWishlist] = useState([]);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [avatarUploading, setAvatarUploading] = useState(false);
    const [editForm, setEditForm] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        phoneNumber: user?.phoneNumber || "",
    });
    const [showAvatarPreview, setShowAvatarPreview] = useState(false);

    // Fetch user profile on mount
    useEffect(() => {
        const loadProfile = async () => {
            if (token) {
                setLoading(true);
                try {
                    await fetchUserProfile();
                } catch (err) {
                    setError(t('profilePage.loadFailed'));
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };
        loadProfile();
    }, [token, fetchUserProfile]);

    // Update editForm when user data changes
    useEffect(() => {
        if (user) {
            setEditForm({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
                phoneNumber: user.phoneNumber || "",
            });
        }
    }, [user]);

    const fetchOrders = async () => {
        if (!token) return;
        try {
            setOrdersLoading(true);
            const response = await fetch(getApiUrl("/api/orders/myorders"), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error(t('profilePage.orders.fetchFailed'));
            const data = await response.json();
            setOrders(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch orders:", err);
        } finally {
            setOrdersLoading(false);
        }
    };

    const fetchWishlist = async () => {
        if (!token) return;
        try {
            setWishlistLoading(true);
            const response = await fetch(getApiUrl("/api/users/profile/wishlist"), {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error(t('profilePage.wishlist.fetchFailed'));
            const data = await response.json();
            setWishlist(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch wishlist:", err);
        } finally {
            setWishlistLoading(false);
        }
    };

    // Fetch orders when orders section is active
    useEffect(() => {
        if (activeSection === "orders" && token && orders.length === 0 && !ordersLoading) {
            fetchOrders();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSection, token]);

    // Fetch wishlist when wishlist section is active
    useEffect(() => {
        if (activeSection === "wishlist" && token) {
            fetchWishlist();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSection, token]);

    const validatePhoneNumber = (phone) => {
        if (!phone) return true; // Phone is optional
        const phoneRegex = /^[6-9]\d{9}$/; // Indian phone number: starts with 6-9, 10 digits total
        return phoneRegex.test(phone);
    };

    const validateName = (name) => {
        const regex = /^[A-Za-z]+([ -][A-Za-z]+)*$/;
        return regex.test(name);
    }

    const handleSaveProfile = async () => {
        if (!token) return;
        // Validation
        if (!editForm.firstName?.trim() || !editForm.lastName?.trim()) {
            setError(t('profilePage.errors.nameRequired'));
            return;
        }

        if (!validateName(editForm.firstName) || !validateName(editForm.lastName)) {
            setError(t('profilePage.errors.invalidName'));
            return;
        }

        if (editForm.phoneNumber && !validatePhoneNumber(editForm.phoneNumber)) {
            setError(t('profilePage.errors.invalidPhone'));
            return;
        }
        try {
            setSaving(true);
            setError("");
            const response = await fetch(getApiUrl("/api/users/profile"), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editForm),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || t('profilePage.errors.updateFailed'));
            }

            const updatedUser = await response.json();
            // Update auth store with new user data
            setUser(updatedUser);
            setIsEditing(false);
        } catch (err) {
            setError(err.message || t('profilePage.errors.updateFailed'));
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/home");
    };

    const handleAvatarButtonClick = () => {
        if (!token) return;
        avatarInputRef.current?.click();
    };

    const handleAvatarChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file || !token) return;

        setAvatarUploading(true);
        try {
            const formData = new FormData();
            formData.append("avatar", file);

            const response = await fetch(getApiUrl("/api/users/profile/avatar"), {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || t('profilePage.avatar.failedDesc'));
            }

            const updatedUser = await response.json();
            setUser(updatedUser);
            toast({
                title: t('profilePage.avatar.updatedTitle'),
                description: t('profilePage.avatar.updatedDesc'),
            });
        } catch (err) {
            toast({
                title: t('profilePage.avatar.failedTitle'),
                description: err.message || t('profilePage.avatar.failedDesc'),
                variant: "destructive",
            });
        } finally {
            setAvatarUploading(false);
            if (event.target) {
                event.target.value = "";
            }
        }
    };

    const orderStats = {
        total: orders.length,
        delivered: orders.filter((o) => o.isDelivered).length,
        inProgress: orders.filter((o) => !o.isDelivered && o.isPaid).length,
        cancelled: 0, // You may need to add this field to your Order model
    };

    if (loading) {
        return <div className="flex justify-center items-center h-screen"><Spinner size="lg" /></div>;
    }

    if (!user) {
        return (
            <div className="flex flex-col justify-center items-center h-screen gap-4">
                <AlertTriangle className="h-10 w-10 text-red-500" />
                <p className="text-center text-red-600 font-medium">{t('profilePage.loginRequired')}</p>
            </div>
        );
    }

    const renderSection = () => {
        switch (activeSection) {
            case "overview":
                return <OverviewSection user={user} t={t} />;
            case "edit":
                return (
                    <EditProfileSection
                        user={user}
                        isEditing={isEditing}
                        editForm={editForm}
                        setEditForm={setEditForm}
                        setIsEditing={setIsEditing}
                        handleSaveProfile={handleSaveProfile}
                        saving={saving}
                        error={error}
                        t={t}
                    />
                );
            case "address":
                return <AddressSection user={user} token={token} t={t} />;
            case "orders":
                return <OrdersSection stats={orderStats} orders={orders} loading={ordersLoading} t={t} />;
            case "wishlist":
                return <WishlistSection wishlist={wishlist} loading={wishlistLoading} token={token} t={t} />;
            case "security":
                return <SecuritySection user={user} token={token} t={t} />;
            default:
                return <OverviewSection user={user} t={t} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with User Info */}
            <div className="bg-white shadow-sm border-b">
                <div className="mx-auto max-w-7xl px-4 py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Avatar onClick={() => setShowAvatarPreview(true)} className="cursor-pointer w-20 h-20">
                                    {user?.avatar ? (
                                        <AvatarImage src={user.avatar} />
                                    ) : (
                                        <AvatarFallback>{user?.firstName?.[0]?.toUpperCase() ?? "U"}</AvatarFallback>
                                    )}
                                </Avatar>
                                <Dialog open={showAvatarPreview} onOpenChange={setShowAvatarPreview}>
                                    <DialogContent className="max-w-lg p-0 bg-transparent border-none shadow-none">
                                        <VisuallyHidden>
                                            <DialogHeader>
                                                <DialogTitle>{t('profilePage.avatar.previewTitle')}</DialogTitle>
                                                <DialogDescription>{t('profilePage.avatar.previewDesc')}</DialogDescription>
                                            </DialogHeader>
                                        </VisuallyHidden>
                                        <div className="w-full h-full flex items-center justify-center">
                                            <img
                                                src={user?.avatar}
                                                alt="Profile"
                                                className="max-w-[90vw] max-h-[90vh] rounded-full object-cover shadow-2xl"
                                            />
                                        </div>
                                    </DialogContent>
                                </Dialog>
                                {avatarUploading && (
                                    <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={handleAvatarButtonClick}
                                    disabled={avatarUploading}
                                    className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-lg hover:bg-gray-50 border disabled:opacity-50"
                                >
                                    <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600" />
                                </button>
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                    {t('profilePage.greeting', { name: user?.firstName })}
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {user?.createdAt
                                        ? t('profilePage.memberSince', {
                                            date: new Date(user.createdAt).toLocaleDateString('en-US', {
                                                month: 'long',
                                                year: 'numeric',
                                            }),
                                        })
                                        : t('profilePage.member')}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('profilePage.logout')}</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="mx-auto max-w-7xl px-4 py-6 sm:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">
                    {/* Sidebar */}
                    <Card className="h-fit lg:sticky lg:top-6">
                        <CardContent className="p-4">
                            <div className="space-y-2">
                                <SidebarItem
                                    icon={<User size={18} />}
                                    label={t('profilePage.sidebar.overview')}
                                    active={activeSection === "overview"}
                                    onClick={() => setActiveSection("overview")}
                                />

                                <SidebarItem
                                    icon={<Edit2 size={18} />}
                                    label={t('profilePage.sidebar.edit')}
                                    active={activeSection === "edit"}
                                    onClick={() => setActiveSection("edit")}
                                />

                                <SidebarItem
                                    icon={<MapPin size={18} />}
                                    label={t('profilePage.sidebar.address')}
                                    active={activeSection === "address"}
                                    onClick={() => setActiveSection("address")}
                                />

                                <SidebarItem
                                    icon={<Package size={18} />}
                                    label={t('profilePage.sidebar.orders')}
                                    active={activeSection === "orders"}
                                    onClick={() => setActiveSection("orders")}
                                />

                                <SidebarItem
                                    icon={<Heart size={18} />}
                                    label={t('profilePage.sidebar.wishlist')}
                                    active={activeSection === "wishlist"}
                                    onClick={() => setActiveSection("wishlist")}
                                />

                                <SidebarItem
                                    icon={<Lock size={18} />}
                                    label={t('profilePage.sidebar.security')}
                                    active={activeSection === "security"}
                                    onClick={() => setActiveSection("security")}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Main Content Area */}
                    <div className="col-span-1 lg:col-span-3">
                        {renderSection()}
                    </div>

                </div>
            </div>
        </div>
    );
}

/* Sidebar Item Component */
function SidebarItem({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-all text-sm font-medium
        ${active
                    ? "bg-slate-900 text-white shadow-md"
                    : "hover:bg-gray-100 text-gray-700"
                }
      `}
        >
            {icon}
            {label}
        </button>
    );
}

/* Overview Section */
function OverviewSection({ user, t }) {
    return (
        <Card>
            <CardHeader className="border-b bg-white">
                <CardTitle className="text-2xl">{t('profilePage.overview.title')}</CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-500 mb-1 block">{t('profilePage.overview.firstName')}</label>
                        <p className="text-base font-semibold text-gray-900">{user?.firstName}</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-500 mb-1 block">{t('profilePage.overview.lastName')}</label>
                        <p className="text-base font-semibold text-gray-900">{user?.lastName}</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-500 mb-1 block">{t('profilePage.overview.email')}</label>
                        <p className="text-base font-semibold text-gray-900">{user?.email}</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-500 mb-1 block">{t('profilePage.overview.phone')}</label>
                        <p className="text-base font-semibold text-gray-900">
                            {user?.phoneNumber || t('profilePage.overview.notProvided')}
                        </p>
                    </div>
                </div>

                <Separator />

                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">{t('profilePage.overview.status')}:</span> {t('profilePage.overview.active')}
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium text-gray-900">{t('profilePage.overview.memberSince')}:</span>
                        {user?.createdAt ? new Date(user.createdAt).toDateString() : "N/A"}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

/* Edit Profile Section */
function EditProfileSection({ user, isEditing, editForm, setEditForm, setIsEditing, handleSaveProfile, saving, error, t }) {
    return (
        <Card>
            <CardHeader className="border-b bg-white flex flex-row items-center justify-between">
                <CardTitle className="text-2xl">{t('profilePage.edit.title')}</CardTitle>
                {!isEditing ? (
                    <Button
                        onClick={() => setIsEditing(true)}
                        className="bg-slate-900 hover:bg-slate-800"
                    >
                        <Edit2 className="w-4 h-4 mr-2" />
                        {t('profilePage.actions.edit')}
                    </Button>
                ) : (
                    <div className="flex gap-2">
                        <Button
                            onClick={handleSaveProfile}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    {t('profilePage.actions.saving')}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    {t('profilePage.actions.save')}
                                </>
                            )}
                        </Button>
                        <Button
                            onClick={() => {
                                setIsEditing(false);
                                setEditForm({
                                    firstName: user?.firstName || "",
                                    lastName: user?.lastName || "",
                                    phoneNumber: user?.phoneNumber || "",
                                });
                            }}
                            variant="outline"
                            disabled={saving}
                        >
                            <X className="w-4 h-4 mr-2" />
                            {t('profilePage.actions.cancel')}
                        </Button>
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-6">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('profilePage.overview.firstName')}
                        </label>
                        <Input
                            value={isEditing ? editForm.firstName : user?.firstName}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            disabled={!isEditing || saving}
                            className="disabled:opacity-60"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('profilePage.overview.lastName')}
                        </label>
                        <Input
                            value={isEditing ? editForm.lastName : user?.lastName}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            disabled={!isEditing || saving}
                            className="disabled:opacity-60"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('profilePage.overview.email')}
                        </label>
                        <Input
                            value={user?.email}
                            disabled
                            className="bg-gray-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">{t('profilePage.edit.emailHint')}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('profilePage.overview.phone')}
                        </label>
                        <Input
                            value={isEditing ? editForm.phoneNumber || "" : user?.phoneNumber || ""}
                            onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                            disabled={!isEditing || saving}
                            className="disabled:opacity-60"
                            placeholder={t('profilePage.edit.phonePlaceholder')}
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/* Address Section */
function AddressSection({ user, token, t }) {
    return (
        <Card>
            <CardHeader className="border-b bg-white flex flex-row items-center justify-between">
                <CardTitle className="text-2xl">{t('profilePage.address.title')}</CardTitle>
                {/* Address management can be added later */}
            </CardHeader>

            <CardContent className="p-6">
                {user?.address && user.address.street ? (
                    <div className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 mb-1">
                                    {user.firstName} {user.lastName}
                                </h3>
                                {user.phoneNumber && <p className="text-gray-600">{user.phoneNumber}</p>}
                            </div>
                        </div>
                        <Separator className="my-4" />
                        <div className="text-gray-700 space-y-1">
                            <p>{user.address.street}</p>
                            <p>{user.address.city}, {user.address.state} {user.address.postalCode}</p>
                            <p className="font-medium">{user.address.country || "India"}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 mb-4">{t('profilePage.address.empty')}</p>
                        <p className="text-sm text-gray-400">{t('profilePage.address.helper')}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/* Orders Section */
function OrdersSection({ stats, orders, loading, t }) {
    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Order Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-slate-900 mb-2">{stats.total}</div>
                        <div className="text-sm text-gray-600">{t('profilePage.orders.total')}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">{stats.delivered}</div>
                        <div className="text-sm text-gray-600">{t('profilePage.orders.delivered')}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">{stats.inProgress}</div>
                        <div className="text-sm text-gray-600">{t('profilePage.orders.processing')}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-red-600 mb-2">{stats.cancelled}</div>
                        <div className="text-sm text-gray-600">{t('profilePage.orders.cancelled')}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders */}
            <Card>
                <CardHeader className="border-b bg-white">
                    <CardTitle className="text-2xl">{t('profilePage.orders.recent')}</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {orders.length === 0 ? (
                        <div className="text-center py-12">
                            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500 mb-4">{t('profilePage.orders.empty')}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.slice(0, 5).map((order) => (
                                <div key={order._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="font-semibold text-sm text-gray-900">{t('profilePage.orders.order')} #{order._id.slice(-8)}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(order.createdAt).toLocaleDateString('en-US', {
                                                    month: 'long',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">₹{order.totalPrice.toFixed(2)}</p>
                                            <p className={`text-xs ${order.isDelivered ? 'text-green-600' : 'text-blue-600'}`}>
                                                {order.isDelivered ? t('profilePage.orders.delivered') : t('profilePage.orders.processing')}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {t('profilePage.orders.items', { count: order.orderItems?.length || 0 })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

/* Wishlist Section */
function WishlistSection({ wishlist, loading, token, t }) {
    if (loading) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="border-b bg-white">
                <CardTitle className="text-2xl">{t('profilePage.wishlist.title')}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{t('profilePage.wishlist.count', {
                    count: wishlist.length,
                })}</p>
            </CardHeader>

            <CardContent className="p-6">
                {wishlist.length === 0 ? (
                    <div className="text-center py-12">
                        <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 mb-4">{t('profilePage.wishlist.empty')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wishlist.map(item => (
                            <div key={item._id || item.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
                                <div className="relative">
                                    <img
                                        src={item.imageURLs?.[0] || item.image || "https://via.placeholder.com/300"}
                                        alt={item.title || item.name}
                                        className="w-full h-48 object-cover"
                                    />
                                    <button className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100">
                                        <Heart className="w-5 h-5 text-red-500 fill-red-500" />
                                    </button>
                                </div>
                                <div className="p-4">
                                    <p className="text-xs text-gray-500 mb-1">{item.artisanId?.businessName || t('profilePage.wishlist.store')}</p>
                                    <h3 className="font-semibold text-gray-900 mb-2">{item.title || item.name}</h3>
                                    <p className="text-lg font-bold text-slate-900 mb-3">₹{item.price?.toFixed(2) || item.price}</p>
                                    <Button className="w-full bg-slate-900 hover:bg-slate-800">
                                        <ShoppingBag className="w-4 h-4 mr-2" />
                                        {t('profilePage.wishlist.addToCart')}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/* Security Section */
function SecuritySection({ user, token, t }) {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const { toast } = useToast();
    const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Delete account states
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState("");
    const [deleteConfirmText, setDeleteConfirmText] = useState("");
    const [deleteError, setDeleteError] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [showDeletePassword, setShowDeletePassword] = useState(false);

    const resetPasswordForm = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setPasswordError("");
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (!token) {
            setPasswordError(t('profilePage.security.errors.loginRequired'));
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError(t('profilePage.security.errors.mismatch'));
            return;
        }

        setPasswordLoading(true);
        setPasswordError("");

        try {
            const response = await fetch(getApiUrl("/api/users/profile/password"), {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || t('profilePage.security.errors.updateFailed'));
            }

            toast({
                title: t('profilePage.security.successTitle'),
                description: t('profilePage.security.successDesc'),
            });
            resetPasswordForm();
            setIsPasswordDialogOpen(false);
        } catch (err) {
            setPasswordError(err.message || t('profilePage.security.errors.updateFailed'));
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="border-b bg-white">
                <CardTitle className="text-2xl">{t('profilePage.security.title')}</CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-8">
                {/* Change Password */}
                <div>
                    <h3 className="font-semibold text-lg mb-2">{t('profilePage.security.changePassword')}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        {t('profilePage.security.description')}
                    </p>
                    <Dialog
                        open={isPasswordDialogOpen}
                        onOpenChange={(open) => {
                            setIsPasswordDialogOpen(open);
                            if (!open) {
                                resetPasswordForm();
                            }
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button className="bg-slate-900 hover:bg-slate-800">
                                <Lock className="w-4 h-4 mr-2" />
                                {t('profilePage.security.changePassword')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{t('profilePage.security.dialogTitle')}</DialogTitle>
                                <DialogDescription>
                                    {t('profilePage.security.dialogDesc')}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        {t('profilePage.security.currentPassword')}
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            required
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        {t('profilePage.security.newPassword')}
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            minLength={8}
                                            placeholder={t('profilePage.security.passwordHint')}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        {t('profilePage.security.confirmPassword')}
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            minLength={8}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                {passwordError && (
                                    <p className="text-sm text-red-600">{passwordError}</p>
                                )}
                                <DialogFooter className="mt-6">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setIsPasswordDialogOpen(false);
                                            resetPasswordForm();
                                        }}
                                        disabled={passwordLoading}
                                    >
                                        {t('profilePage.actions.cancel')}
                                    </Button>
                                    <Button type="submit" disabled={passwordLoading}>
                                        {passwordLoading ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                {t('profilePage.security.updating')}
                                            </span>
                                        ) : (
                                            t('profilePage.security.update')
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Separator />

                {/* Become a Seller - Only show if user is not already an artisan */}
                {user?.role !== 'ARTISAN' && (
                    <>
                        <div>
                            <h3 className="font-semibold text-lg mb-2">{t('profilePage.artisan.title')}</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                {t('profilePage.artisan.description')}
                            </p>
                            <Button
                                onClick={() => navigate("/build-store")}
                                className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950"
                            >
                                {t('profilePage.artisan.apply')}
                            </Button>
                        </div>

                        <Separator />
                    </>
                )}

                {/* Danger Zone */}
                <div>
                    <h3 className="font-semibold text-lg text-red-600 mb-2">{t('profilePage.danger.title')}</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        {t('profilePage.danger.warning')}
                    </p>
                    <AlertDialog
                        open={isDeleteDialogOpen}
                        onOpenChange={(open) => {
                            setIsDeleteDialogOpen(open);
                            if (!open) {
                                setDeletePassword("");
                                setDeleteConfirmText("");
                                setDeleteError("");
                                setShowDeletePassword(false);
                            }
                        }}
                    >
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive">{t('profilePage.danger.delete')}</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-600">{t('profilePage.danger.confirmTitle')}</AlertDialogTitle>
                                <AlertDialogDescription className="space-y-3">
                                    <p className="font-semibold text-base text-gray-900">
                                        {t('profilePage.danger.irreversible')}
                                    </p>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                                        <p className="text-sm text-red-800 font-medium mb-2">{t('profilePage.danger.willDelete')}</p>
                                        <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                            <li>{t('profilePage.danger.items.profile')}</li>
                                            <li>{t('profilePage.danger.items.orders')}</li>
                                            <li>{t('profilePage.danger.items.wishlist')}</li>
                                            <li>{t('profilePage.danger.items.all')}</li>
                                        </ul>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-4">
                                        {t('profilePage.danger.confirmEmail')}
                                    </p>
                                    <Input
                                        type="text"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        placeholder={t('profilePage.danger.emailPlaceholder')}
                                        className="mt-2"
                                    />
                                    <p className="text-sm text-gray-600 mt-2">
                                        {t('profilePage.danger.confirmPassword')}
                                    </p>
                                    <div className="relative mt-2">
                                        <Input
                                            type={showDeletePassword ? "text" : "password"}
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            placeholder={t('profilePage.danger.passwordPlaceholder')}
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowDeletePassword(!showDeletePassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                        >
                                            {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {deleteError && (
                                        <p className="text-sm text-red-600 mt-2">{deleteError}</p>
                                    )}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel
                                    onClick={() => {
                                        setDeletePassword("");
                                        setDeleteConfirmText("");
                                        setDeleteError("");
                                    }}
                                    disabled={deleteLoading}
                                >
                                    Cancel
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={async (e) => {
                                        e.preventDefault();

                                        if (!token) {
                                            setDeleteError(t('profilePage.danger.errors.loginRequired'));
                                            return;
                                        }

                                        if (deleteConfirmText !== user?.email) {
                                            setDeleteError(t('profilePage.danger.errors.emailMismatch'));
                                            return;
                                        }

                                        if (!deletePassword) {
                                            setDeleteError(t('profilePage.danger.errors.passwordRequired'));
                                            return;
                                        }

                                        setDeleteLoading(true);
                                        setDeleteError("");

                                        try {
                                            const response = await fetch(getApiUrl("/api/users/profile/delete"), {
                                                method: "DELETE",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                    Authorization: `Bearer ${token}`,
                                                },
                                                body: JSON.stringify({ password: deletePassword }),
                                            });

                                            const data = await response.json();
                                            if (!response.ok) {
                                                throw new Error(data.message || t('profilePage.danger.errors.failed'));
                                            }

                                            toast({
                                                title: t('profilePage.danger.deletedTitle'),
                                                description: t('profilePage.danger.deletedDesc'),
                                            });

                                            // Logout and redirect
                                            logout();
                                            setTimeout(() => {
                                                navigate("/");
                                            }, 1000);
                                        } catch (err) {
                                            setDeleteError(err.message || t('profilePage.danger.errors.failed'));
                                        } finally {
                                            setDeleteLoading(false);
                                        }
                                    }}
                                    disabled={deleteLoading || deleteConfirmText !== user?.email || !deletePassword}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    {deleteLoading ? (
                                        <span className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t('profilePage.danger.deleting')}
                                        </span>
                                    ) : (
                                        t('profilePage.danger.confirmAction')
                                    )}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    );
}