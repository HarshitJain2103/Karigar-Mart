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

export default function ProfilePage() {
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

    // Fetch user profile on mount
    useEffect(() => {
        const loadProfile = async () => {
            if (token) {
                setLoading(true);
                try {
                    await fetchUserProfile();
                } catch (err) {
                    setError("Failed to load profile");
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
            const response = await fetch("http://localhost:8000/api/orders/myorders", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch orders");
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
            const response = await fetch("http://localhost:8000/api/users/profile/wishlist", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch wishlist");
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

    const handleSaveProfile = async () => {
        if (!token) return;
        try {
            setSaving(true);
            setError("");
            const response = await fetch("http://localhost:8000/api/users/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editForm),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update profile");
            }

            const updatedUser = await response.json();
            // Update auth store with new user data
            setUser(updatedUser);
            setIsEditing(false);
        } catch (err) {
            setError(err.message || "Failed to update profile");
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

            const response = await fetch("http://localhost:8000/api/users/profile/avatar", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to upload avatar");
            }

            const updatedUser = await response.json();
            setUser(updatedUser);
            toast({
                title: "Profile picture updated",
                description: "Your avatar has been refreshed successfully.",
            });
        } catch (err) {
            toast({
                title: "Avatar upload failed",
                description: err.message || "Unable to upload profile picture.",
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
        return (
            <div className="flex justify-center items-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col justify-center items-center h-screen gap-4">
                <AlertTriangle className="h-10 w-10 text-red-500" />
                <p className="text-center text-red-600 font-medium">Please log in to view your profile</p>
            </div>
        );
    }

    const renderSection = () => {
        switch (activeSection) {
            case "overview":
                return <OverviewSection user={user} />;
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
                    />
                );
            case "address":
                return <AddressSection user={user} token={token} />;
            case "orders":
                return <OrdersSection stats={orderStats} orders={orders} loading={ordersLoading} />;
            case "wishlist":
                return <WishlistSection wishlist={wishlist} loading={wishlistLoading} token={token} />;
            case "security":
                return <SecuritySection user={user} token={token} />;
            default:
                return <OverviewSection user={user} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header with User Info */}
            <div className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
                                    {user?.avatar && (
                                        <AvatarImage src={user.avatar} alt={`${user.firstName} ${user.lastName}`} />
                                    )}
                                    <AvatarFallback className="text-xl sm:text-2xl font-bold bg-gradient-to-br from-slate-700 to-slate-900 text-white">
                                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
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
                                    Hi, {user?.firstName}!
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {user?.createdAt ? (
                                        <>Member since {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</>
                                    ) : (
                                        <>Member</>
                                    )}
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                        >
                            <LogOut className="w-4 h-4" />
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 lg:gap-8">

                    {/* Sidebar */}
                    <Card className="h-fit lg:sticky lg:top-6">
                        <CardContent className="p-4">
                            <div className="space-y-2">
                                <SidebarItem
                                    icon={<User size={18} />}
                                    label="Profile Overview"
                                    active={activeSection === "overview"}
                                    onClick={() => setActiveSection("overview")}
                                />

                                <SidebarItem
                                    icon={<Edit2 size={18} />}
                                    label="Edit Profile"
                                    active={activeSection === "edit"}
                                    onClick={() => setActiveSection("edit")}
                                />

                                <SidebarItem
                                    icon={<MapPin size={18} />}
                                    label="Shipping Address"
                                    active={activeSection === "address"}
                                    onClick={() => setActiveSection("address")}
                                />

                                <SidebarItem
                                    icon={<Package size={18} />}
                                    label="My Orders"
                                    active={activeSection === "orders"}
                                    onClick={() => setActiveSection("orders")}
                                />

                                <SidebarItem
                                    icon={<Heart size={18} />}
                                    label="Wishlist"
                                    active={activeSection === "wishlist"}
                                    onClick={() => setActiveSection("wishlist")}
                                />

                                <SidebarItem
                                    icon={<Lock size={18} />}
                                    label="Account Security"
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
function OverviewSection({ user }) {
    return (
        <Card>
            <CardHeader className="border-b bg-white">
                <CardTitle className="text-2xl">Profile Overview</CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-500 mb-1 block">First Name</label>
                        <p className="text-base font-semibold text-gray-900">{user?.firstName}</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-500 mb-1 block">Last Name</label>
                        <p className="text-base font-semibold text-gray-900">{user?.lastName}</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-500 mb-1 block">Email Address</label>
                        <p className="text-base font-semibold text-gray-900">{user?.email}</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-gray-500 mb-1 block">Phone Number</label>
                        <p className="text-base font-semibold text-gray-900">
                            {user?.phoneNumber || "Not provided"}
                        </p>
                    </div>
                </div>

                <Separator />

                <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">
                        <span className="font-medium text-gray-900">Account Status:</span> Active
                    </p>
                    <p className="text-sm text-gray-600 mt-2">
                        <span className="font-medium text-gray-900">Member Since:</span>{" "}
                        {user?.createdAt ? new Date(user.createdAt).toDateString() : "N/A"}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}

/* Edit Profile Section */
function EditProfileSection({ user, isEditing, editForm, setEditForm, setIsEditing, handleSaveProfile, saving, error }) {
    return (
        <Card>
            <CardHeader className="border-b bg-white flex flex-row items-center justify-between">
                <CardTitle className="text-2xl">Edit Profile</CardTitle>
                {!isEditing ? (
                    <Button
                        onClick={() => setIsEditing(true)}
                        className="bg-slate-900 hover:bg-slate-800"
                    >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
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
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save
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
                            Cancel
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
                            First Name
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
                            Last Name
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
                            Email Address
                        </label>
                        <Input
                            value={user?.email}
                            disabled
                            className="bg-gray-100"
                        />
                        <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number
                        </label>
                        <Input
                            value={isEditing ? editForm.phoneNumber || "" : user?.phoneNumber || ""}
                            onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                            disabled={!isEditing || saving}
                            className="disabled:opacity-60"
                            placeholder="Enter phone number"
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

/* Address Section */
function AddressSection({ user, token }) {
    return (
        <Card>
            <CardHeader className="border-b bg-white flex flex-row items-center justify-between">
                <CardTitle className="text-2xl">Shipping Address</CardTitle>
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
                        <p className="text-gray-500 mb-4">No shipping address added yet</p>
                        <p className="text-sm text-gray-400">Address will be added when you place an order</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

/* Orders Section */
function OrdersSection({ stats, orders, loading }) {
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
                        <div className="text-sm text-gray-600">Total Orders</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-green-600 mb-2">{stats.delivered}</div>
                        <div className="text-sm text-gray-600">Delivered</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">{stats.inProgress}</div>
                        <div className="text-sm text-gray-600">In Progress</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 text-center">
                        <div className="text-3xl font-bold text-red-600 mb-2">{stats.cancelled}</div>
                        <div className="text-sm text-gray-600">Cancelled</div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Orders */}
            <Card>
                <CardHeader className="border-b bg-white">
                    <CardTitle className="text-2xl">Recent Orders</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    {orders.length === 0 ? (
                        <div className="text-center py-12">
                            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <p className="text-gray-500 mb-4">You haven't placed any orders yet</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.slice(0, 5).map((order) => (
                                <div key={order._id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="font-semibold text-sm text-gray-900">Order #{order._id.slice(-8)}</p>
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
                                                {order.isDelivered ? 'Delivered' : 'Processing'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {order.orderItems?.length || 0} item{order.orderItems?.length !== 1 ? 's' : ''}
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
function WishlistSection({ wishlist, loading, token }) {
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
                <CardTitle className="text-2xl">My Wishlist</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved</p>
            </CardHeader>

            <CardContent className="p-6">
                {wishlist.length === 0 ? (
                    <div className="text-center py-12">
                        <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-500 mb-4">Your wishlist is empty</p>
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
                                    <p className="text-xs text-gray-500 mb-1">{item.artisanId?.businessName || "Store"}</p>
                                    <h3 className="font-semibold text-gray-900 mb-2">{item.title || item.name}</h3>
                                    <p className="text-lg font-bold text-slate-900 mb-3">₹{item.price?.toFixed(2) || item.price}</p>
                                    <Button className="w-full bg-slate-900 hover:bg-slate-800">
                                        <ShoppingBag className="w-4 h-4 mr-2" />
                                        Add to Cart
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
function SecuritySection({ user, token }) {
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
            setPasswordError("You must be logged in to change your password.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match.");
            return;
        }

        setPasswordLoading(true);
        setPasswordError("");

        try {
            const response = await fetch("http://localhost:8000/api/users/profile/password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || "Failed to update password");
            }

            toast({
                title: "Password updated",
                description: "Use your new password the next time you log in.",
            });
            resetPasswordForm();
            setIsPasswordDialogOpen(false);
        } catch (err) {
            setPasswordError(err.message || "Failed to update password.");
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="border-b bg-white">
                <CardTitle className="text-2xl">Account Security</CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-8">
                {/* Change Password */}
                <div>
                    <h3 className="font-semibold text-lg mb-2">Change Password</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Update your password to keep your account secure
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
                                Change Password
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Change password</DialogTitle>
                                <DialogDescription>
                                    For your security we need your current password before setting a new one.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleChangePassword} className="space-y-4 mt-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">
                                        Current Password
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
                                        New Password
                                    </label>
                                    <div className="relative">
                                        <Input
                                            type={showNewPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                            minLength={8}
                                            placeholder="At least 8 characters"
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
                                        Confirm New Password
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
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={passwordLoading}>
                                        {passwordLoading ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Updating
                                            </span>
                                        ) : (
                                            "Update Password"
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
                            <h3 className="font-semibold text-lg mb-2">Become an Artisan</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Want to sell your own handcrafted products on KarigarMart?
                            </p>
                            <Button
                                onClick={() => navigate("/build-store")}
                                className="bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950"
                            >
                                Apply to Become a Seller
                            </Button>
                        </div>

                        <Separator />
                    </>
                )}

                {/* Danger Zone */}
                <div>
                    <h3 className="font-semibold text-lg text-red-600 mb-2">Danger Zone</h3>
                    <p className="text-sm text-gray-600 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
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
                            <Button variant="destructive">Delete Account</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-600">Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription className="space-y-3">
                                    <p className="font-semibold text-base text-gray-900">
                                        This action cannot be undone. This will permanently delete your account and remove all associated data.
                                    </p>
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                                        <p className="text-sm text-red-800 font-medium mb-2">This will delete:</p>
                                        <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                                            <li>Your profile and account information</li>
                                            <li>Your order history</li>
                                            <li>Your wishlist and cart</li>
                                            <li>All associated data</li>
                                        </ul>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-4">
                                        Please type <strong className="font-mono text-red-600">{user?.email || "your email"}</strong> to confirm:
                                    </p>
                                    <Input
                                        type="text"
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        placeholder="Type your email to confirm"
                                        className="mt-2"
                                    />
                                    <p className="text-sm text-gray-600 mt-2">
                                        Enter your password to verify this action:
                                    </p>
                                    <div className="relative mt-2">
                                        <Input
                                            type={showDeletePassword ? "text" : "password"}
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            placeholder="Enter your password"
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
                                            setDeleteError("You must be logged in to delete your account.");
                                            return;
                                        }

                                        if (deleteConfirmText !== user?.email) {
                                            setDeleteError("Email confirmation does not match.");
                                            return;
                                        }

                                        if (!deletePassword) {
                                            setDeleteError("Please enter your password to confirm.");
                                            return;
                                        }

                                        setDeleteLoading(true);
                                        setDeleteError("");

                                        try {
                                            const response = await fetch("http://localhost:8000/api/users/profile/delete", {
                                                method: "DELETE",
                                                headers: {
                                                    "Content-Type": "application/json",
                                                    Authorization: `Bearer ${token}`,
                                                },
                                                body: JSON.stringify({ password: deletePassword }),
                                            });

                                            const data = await response.json();
                                            if (!response.ok) {
                                                throw new Error(data.message || "Failed to delete account");
                                            }

                                            toast({
                                                title: "Account deleted",
                                                description: "Your account has been permanently deleted.",
                                            });

                                            // Logout and redirect
                                            logout();
                                            setTimeout(() => {
                                                navigate("/");
                                            }, 1000);
                                        } catch (err) {
                                            setDeleteError(err.message || "Failed to delete account. Please try again.");
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
                                            Deleting...
                                        </span>
                                    ) : (
                                        "I understand, delete my account"
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