import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/authStore";
import { uploadImage } from "../lib/uploadService";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const STORAGE_KEY = "karigar.store.v1";
const defaultDraft = {
  storeName: "",
  tagline: "",
  city: "",
  state: "",
  craft: "",
  about: "",
  media: { heroImageURL: "", galleryImageURLs: [] },
  theme: { preset: "modern", color: "#0f172a" },
  seo: { metaDescription: "", keywords: [] },
  products: [],
  status: "draft",
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function ImageUploader({ images = [], onChange, max = 8, single = false, uploadType }) {
  const inputRef = useRef(null);
  const token = useAuthStore((state) => state.token);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const availableSlots = max - images.length;
    if (files.length > availableSlots) {
      alert(`You can only upload ${availableSlots} more image(s). Please select fewer files.`);
      if (inputRef.current) inputRef.current.value = null;
      return;
    }

    setIsUploading(true);
    setError('');
    try {
      if (single) {
        const url = await uploadImage(files[0], token, uploadType);
        onChange([url]);
      } else {
        let currentImages = [...images];
        for (const file of files) {
          const url = await uploadImage(file, token, uploadType);
          currentImages.push(url);
        }
        onChange(currentImages);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = null;
    }
  };

  return (
    <div className="space-y-2">
      <input ref={inputRef} type="file" accept="image/*,.png,.jpg,.jpeg" multiple={!single} onChange={handleFileChange} className="hidden" />
      <div className="flex items-center gap-3">
        {/* DISABLE BUTTON WHEN LIMIT IS REACHED --- */}
        <Button
          variant="outline"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || images.length >= max}
        >
          {isUploading ? "Uploading..." : `Upload ${single ? "Image" : "Images"}`}
        </Button>
        <div className="text-sm text-muted-foreground">{images.length}/{max}</div>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <div className="grid grid-cols-3 gap-2 mt-2 p-2 border rounded-lg bg-slate-50 max-h-48 overflow-y-auto min-h-[6rem]">
        {images.length === 0 && <div className="col-span-3 text-sm text-muted-foreground p-4 border-2 border-dashed rounded-lg text-center">No images uploaded.</div>}
        {images.map((url, i) => (
          <div key={i} className="relative rounded overflow-hidden border">
            <img src={url} alt={`upload-${i}`} className="w-full h-24 object-cover" />
            <button type="button" aria-label="remove" className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-xs" onClick={() => onChange(images.filter((_, idx) => idx !== i))}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, onEdit, onRemove }) {
  return (
    <div className="border rounded-lg p-3 bg-white flex gap-3 items-start">
      <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
        {product.imageURLs?.[0] ? <img src={product.imageURLs[0]} alt={product.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No Image</div>}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-semibold">{product.title || "Untitled"}</div>
            <div className="text-sm text-muted-foreground">{product.description?.slice(0, 60)}...</div>
          </div>
          <div className="text-right">
            <div className="font-medium">{product.price ? `₹${product.price}` : "—"}</div>
            <div className="text-sm text-muted-foreground">{product.inventory || "0"} in stock</div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(product)}>Edit</Button>
          <Button size="sm" variant="ghost" type="button" onClick={() => onRemove(product.id)}>Remove</Button>
        </div>
      </div>
    </div>
  );
}

export default function BuildYourStoreFull() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);

  const [draft, setDraft] = useState(() => {
    try {
      const savedDraft = localStorage.getItem(STORAGE_KEY);
      return savedDraft ? JSON.parse(savedDraft) : defaultDraft;
    } catch {
      return defaultDraft;
    }
  });

  const [step, setStep] = useState("identity");
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [previewMode, setPreviewMode] = useState("desktop");
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/categories');
        if (!response.ok) throw new Error('Failed to fetch categories');
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error(err);
        setError("Could not load product categories. Please refresh the page.");
      }
    };
    if (token) {
      fetchCategories();
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const update = (k, v) => setDraft((p) => ({ ...p, [k]: v }));
  const updateNested = (path, val) => setDraft((p) => {
    const out = JSON.parse(JSON.stringify(p)); // Deep copy to prevent mutation issues
    let cur = out;
    for (let i = 0; i < path.length - 1; i++) {
      cur = cur[path[i]] = { ...cur[path[i]] };
    }
    cur[path[path.length - 1]] = val;
    return out;
  });

  const openNewProduct = () => { setEditingProduct({ id: uid(), title: "", description: "", price: "", inventory: "", categoryId: "", imageURLs: [] }); setShowProductDialog(true); };
  const openEditProduct = (p) => { setEditingProduct(p); setShowProductDialog(true); };
  const saveProduct = (prod) => {
    setDraft((prev) => {
      const exists = (prev.products || []).some((x) => x.id === prod.id);
      return {
        ...prev,
        products: exists ? prev.products.map((x) => (x.id === prod.id ? prod : x)) : [...(prev.products || []), prod],
      };
    });
    setShowProductDialog(false);
    setEditingProduct(null);
  };
  const removeProduct = (id) => setDraft((p) => ({ ...p, products: (p.products || []).filter((x) => x.id !== id) }));

  const healthScore = () => {
    let score = 0;
    if (draft.storeName) score += 20;
    if (draft.city && draft.state) score += 10;
    if (draft.products?.length > 0) score += 30;
    if (draft.media?.heroImageURL) score += 20;
    if (draft.about) score += 20;
    return Math.min(100, score);
  };

  const publish = async () => {
    if (!draft.storeName || !draft.city || !draft.state) return alert("Please add store name, city and state before publishing.");
    if (!draft.products || draft.products.length === 0) return alert("Add at least one product to publish.");
    const badProduct = draft.products.find((p) => !p.title || !p.price || !p.categoryId);
    if (badProduct) return alert(`Product "${badProduct.title || 'Untitled'}" needs a title, price, and category.`);

    setIsLoading(true);
    setError("");

    try {
      const profileData = {
        storeName: draft.storeName,
        tagline: draft.tagline,
        about: draft.about,
        theme: draft.theme,
        seo: draft.seo,
        media: {
          heroImageURL: draft.media.heroImageURL,
          galleryImageURLs: draft.media.galleryImageURLs,
        },

        address: {
          city: draft.city,
          state: draft.state,
        },
      };

      const profileResponse = await fetch('http://localhost:8000/api/artisans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profileData),
      });

      if (!profileResponse.ok) {
        const errData = await profileResponse.json();
        throw new Error(errData.message || 'Failed to create your store profile.');
      }

      const createdProfile = await profileResponse.json();

      for (const product of draft.products) {
        const productData = {
          artisanId: createdProfile._id,
          categoryId: product.categoryId,
          title: product.title,
          description: product.description,
          price: parseFloat(product.price),
          inventory: parseInt(product.inventory, 10),
          imageURLs: product.imageURLs,
        };

        const productResponse = await fetch('http://localhost:8000/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(productData),
        });

        if (!productResponse.ok) {
          const errData = await productResponse.json();
          throw new Error(`Failed to create product "${product.title}": ${errData.message}`);
        }
      }

      alert("Congratulations! Your store has been published successfully!");
      localStorage.removeItem(STORAGE_KEY);
      navigate('/dashboard');

    } catch (err) {
      console.error("Publishing failed:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <a href="/" className="text-xl font-bold">ArtisanMarket</a>
            <div className="hidden md:block w-96">
              <Progress value={healthScore()} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">Setup progress: {healthScore()}%</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); alert('Draft saved locally'); } catch { alert('Save failed'); } }}>Save</Button>
            <Button variant="ghost" onClick={() => alert('Open help (AI assistant)')}>Help</Button>
            <Avatar className="w-8 h-8">
              {user?.avatar ? (
                <AvatarImage src={user.avatar} alt={user.firstName} />
              ) : (
                <AvatarFallback>
                  {user?.firstName?.[0]?.toUpperCase() ?? "U"}
                </AvatarFallback>
              )}
            </Avatar>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <Card>
            <CardContent className="pt-6 grid md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2">
                <h1 className="text-2xl font-bold">Bring Your Craft Online — Build Your Store in Minutes</h1>
                <p className="text-sm text-muted-foreground mt-1">We’ll guide you step-by-step. Use the AI assistant (right) anytime for suggestions.</p>
                <div className="mt-4 flex gap-3">
                  <Button onClick={() => { document.getElementById('wizard-start')?.scrollIntoView({ behavior: 'smooth' }); }}>Start Building</Button>
                  <Button variant="outline" onClick={() => alert('Open tutorial (stub)')}>Watch Tutorial</Button>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-gray-50 border rounded p-3 text-center text-sm">Quick tips: Use 3 photos per product for best results</div>
              </div>
            </CardContent>
          </Card>

          <div id="wizard-start">
            <Tabs value={step} onValueChange={(v) => setStep(v)} className="w-full">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-1/4">
                  <Card className="p-4">
                    <div className="text-sm font-semibold mb-3">Steps</div>
                    <div className="flex flex-col gap-1">
                      <button className={`text-left w-full px-3 py-2 rounded text-sm ${step === 'identity' ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600'}`} onClick={() => setStep('identity')}>1. Identity</button>
                      <button className={`text-left w-full px-3 py-2 rounded text-sm ${step === 'about' ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600'}`} onClick={() => setStep('about')}>2. About</button>
                      <button className={`text-left w-full px-3 py-2 rounded text-sm ${step === 'products' ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600'}`} onClick={() => setStep('products')}>3. Products</button>
                      <button className={`text-left w-full px-3 py-2 rounded text-sm ${step === 'media' ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600'}`} onClick={() => setStep('media')}>4. Media</button>
                      <button className={`text-left w-full px-3 py-2 rounded text-sm ${step === 'theme' ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600'}`} onClick={() => setStep('theme')}>5. Theme</button>
                      <button className={`text-left w-full px-3 py-2 rounded text-sm ${step === 'seo' ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600'}`} onClick={() => setStep('seo')}>6. Marketing</button>
                      <button className={`text-left w-full px-3 py-2 rounded text-sm ${step === 'publish' ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600'}`} onClick={() => setStep('publish')}>7. Publish</button>
                    </div>
                    <Separator className="my-4" />
                    <div className="text-xs text-muted-foreground">Autosave enabled • Local draft</div>
                  </Card>
                </div>

                <div className="flex-1">
                  <TabsContent value="identity">
                    <Card>
                      <CardHeader>
                        <CardTitle>Identity Setup</CardTitle>
                        <CardDescription>Store name, tagline and basic location</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Input value={draft.storeName} onChange={(e) => update('storeName', e.target.value)} placeholder="Store name" />
                        <Input value={draft.tagline} onChange={(e) => update('tagline', e.target.value)} placeholder="Tagline (AI suggest)" />
                        <div className="flex gap-2">
                          <Input value={draft.city} onChange={(e) => update('city', e.target.value)} placeholder="City" />
                          <Input value={draft.state} onChange={(e) => update('state', e.target.value)} placeholder="State" />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button onClick={() => setStep('about')}>Next</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="about">
                    <Card>
                      <CardHeader><CardTitle>About your store</CardTitle><CardDescription>Tell about your store — AI will help refine it.</CardDescription></CardHeader>
                      <CardContent>
                        <Textarea value={draft.about} onChange={(e) => update('about', e.target.value)} placeholder="Write about your store here..." className="min-h-[200px]" />
                        <div className="flex gap-2 justify-end mt-4">
                          <Button variant="outline" onClick={() => { alert('AI feature stub'); }}>Suggest with AI</Button>
                          <Button onClick={() => setStep('products')}>Next</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="products">
                    <Card>
                      <CardHeader><CardTitle>Product Catalog</CardTitle><CardDescription>Add the products you want to sell in your store.</CardDescription></CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-semibold">Your Products ({(draft.products || []).length})</div>
                          <Button onClick={openNewProduct}>+ Add Product</Button>
                        </div>
                        <div className="space-y-2">
                          {(draft.products || []).map((p) => <ProductCard key={p.id} product={p} onEdit={openEditProduct} onRemove={removeProduct} />)}
                          {(draft.products || []).length === 0 && <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg">No products yet. Click 'Add Product' to start.</div>}
                        </div>
                        <div className="flex justify-end pt-2"><Button onClick={() => setStep('media')}>Next</Button></div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="media">
                    <Card>
                      <CardHeader>
                        <CardTitle>Media & Branding</CardTitle>
                        <CardDescription>Upload a hero image for your store page and a few gallery images.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-base font-medium">Hero Image (Store Banner)</Label>
                          <ImageUploader
                            images={draft.media.heroImageURL ? [draft.media.heroImageURL] : []}
                            onChange={(urls) => updateNested(['media', 'heroImageURL'], urls[0] || "")}
                            uploadType="profile/hero"
                            single={true}
                            max={1}
                          />
                        </div>
                        <div>
                          <Label className="text-base font-medium">Gallery Images</Label>
                          <ImageUploader
                            images={draft.media.galleryImageURLs || []}
                            onChange={(urls) => updateNested(['media', 'galleryImageURLs'], urls)}
                            uploadType="profile/gallery"
                            max={8}
                          />
                        </div>
                        <div className="flex justify-end pt-2">
                          <Button onClick={() => setStep('theme')}>Next</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="theme">
                    <Card>
                      <CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Choose a theme that best represents your craft.</CardDescription></CardHeader>
                      <CardContent>
                        <div className="flex gap-4 items-center">
                          <Label>Theme Preset</Label>
                          <Select onValueChange={(v) => updateNested(['theme', 'preset'], v)} defaultValue={draft.theme.preset}>
                            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="modern">Modern</SelectItem>
                              <SelectItem value="classic">Classic</SelectItem>
                              <SelectItem value="minimal">Minimal</SelectItem>
                              <SelectItem value="rustic">Rustic</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end pt-4"><Button onClick={() => setStep('seo')}>Next</Button></div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="seo">
                    <Card>
                      <CardHeader><CardTitle>Marketing & SEO</CardTitle><CardDescription>Help customers find your store on search engines.</CardDescription></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-1">
                          <Label htmlFor="meta-desc">Meta Description</Label>
                          <Textarea id="meta-desc" placeholder="A short description of your store for search engines." value={draft.seo.metaDescription} onChange={(e) => updateNested(['seo', 'metaDescription'], e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="keywords">Keywords</Label>
                          <Input id="keywords" placeholder="e.g., handmade, pottery, indian craft" value={(draft.seo.keywords || []).join(', ')} onChange={(e) => updateNested(['seo', 'keywords'], e.target.value.split(',').map(s => s.trim()))} />
                        </div>
                        <div className="flex justify-end pt-2"><Button onClick={() => setStep('publish')}>Next</Button></div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="publish">
                    <Card>
                      <CardHeader><CardTitle>Review & Publish</CardTitle><CardDescription>Review your store details and publish to go live!</CardDescription></CardHeader>
                      <CardContent>
                        <div className="p-4 border rounded-lg bg-white">
                          <h4 className="font-semibold mb-3">Store Health Checklist</h4>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">{draft.storeName ? '✅' : '❌'} Store Name</li>
                            <li className="flex items-center gap-2">{draft.city && draft.state ? '✅' : '❌'} Location</li>
                            <li className="flex items-center gap-2">{(draft.products || []).length > 0 ? '✅' : '❌'} At least one product</li>
                            <li className="flex items-center gap-2">{draft.about ? '✅' : '❌'} About your store</li>
                          </ul>
                          <Progress value={healthScore()} className="mt-4 h-2" />
                        </div>
                        <div className="mt-6 flex gap-3 justify-end">
                          <Button onClick={publish} disabled={isLoading}>
                            {isLoading ? 'Publishing...' : 'Publish Store'}
                          </Button>
                        </div>
                        {error && <p className="text-red-500 text-sm mt-4 text-right">{error}</p>}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </div>
              </div>
            </Tabs>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader><CardTitle>Live Store Preview</CardTitle></CardHeader>
            <CardContent>
              <div className="flex justify-center gap-2 mb-4">
                <Button size="sm" variant={previewMode === 'desktop' ? 'secondary' : 'outline'} onClick={() => setPreviewMode('desktop')}>Desktop</Button>
                <Button size="sm" variant={previewMode === 'mobile' ? 'secondary' : 'outline'} onClick={() => setPreviewMode('mobile')}>Mobile</Button>
              </div>
              <div className={`border-2 rounded-lg bg-white mx-auto transition-all duration-300 ${previewMode === 'mobile' ? 'w-full w-max[355px] h-[667px]' : 'w-full h-[400px]'}`}>
                <div className="w-full h-1/3 bg-gray-200 flex items-center justify-center text-muted-foreground">
                  {draft.media.heroImageURL ? <img src={draft.media.heroImageURL} alt="Hero Preview" className="w-full h-full object-cover" /> : 'Hero Image Preview'}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold">{draft.storeName || 'Your Store Name'}</h3>
                  <p className="text-sm text-muted-foreground">{draft.tagline || 'A short tagline will appear here'}</p>
                  <Separator className="my-4" />
                  <div className="space-y-2">
                    {(draft.products || []).slice(0, 2).map(p => (
                      <div key={p.id} className="border rounded p-2 flex items-center gap-2">
                        <div className="w-10 h-10 bg-gray-100 rounded">
                          {p.imageURLs?.[0] ? <img src={p.imageURLs[0]} alt={p.title} className="w-full h-full object-cover rounded" /> : null}
                        </div>
                        <div className="flex-1"><div className="text-sm font-medium">{p.title}</div></div>
                        <div className="text-sm font-semibold">{p.price ? `₹${p.price}` : ''}</div>
                      </div>
                    ))}
                    {(draft.products || []).length === 0 && <div className="text-xs text-muted-foreground text-center py-4">Products will appear here...</div>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Karigar Assistant</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-3">Get help with descriptions, translations, and more.</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { alert('Generate descriptions (stub)'); }}>Auto-describe</Button>
                <Button variant="outline" onClick={() => { alert('Translate to Hindi (stub)'); }}>Translate</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct?.id && editingProduct.title ? 'Edit product' : 'Add product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1">
              <Label htmlFor="product-title">Product title</Label>
              <Input id="product-title" placeholder="e.g., Hand-painted Ceramic Mug" value={editingProduct?.title || ''} onChange={(e) => setEditingProduct(prev => ({ ...prev, title: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="product-desc">Description</Label>
              <Textarea id="product-desc" placeholder="Describe your product..." value={editingProduct?.description || ''} onChange={(e) => setEditingProduct(prev => ({ ...prev, description: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="category">Category</Label>
              <Select
                value={editingProduct?.categoryId || ""}
                onValueChange={(value) => setEditingProduct(prev => ({ ...prev, categoryId: value }))}
                required
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 && <SelectItem value="loading" disabled>Loading...</SelectItem>}
                  {categories.map(cat => (
                    <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="product-price">Price (₹)</Label>
                <Input id="product-price" placeholder="e.g., 999" type="number" value={editingProduct?.price || ''} onChange={(e) => setEditingProduct(prev => ({ ...prev, price: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="product-inv">Inventory</Label>
                <Input id="product-inv" placeholder="e.g., 10" type="number" value={editingProduct?.inventory || ''} onChange={(e) => setEditingProduct(prev => ({ ...prev, inventory: e.target.value }))} required />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Images</div>
              <ImageUploader
                images={editingProduct?.imageURLs || []}
                onChange={(urls) => setEditingProduct(prev => ({ ...prev, imageURLs: urls }))}
                uploadType="products"
                max={8}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" type="button" onClick={() => { setShowProductDialog(false); setEditingProduct(null); }}>Cancel</Button>
              <Button type="button" onClick={() => { if (!editingProduct) return; saveProduct(editingProduct); }}>Save Product</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet>
        <SheetTrigger asChild>
          <Button className="fixed bottom-6 right-6 shadow-lg rounded-full h-14 w-14 font-semibold">AI</Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-96 p-6">
          <h3 className="text-lg font-semibold">Karigar Assistant</h3>
          <div className="text-sm text-muted-foreground mt-2">Generate content, translate, and get tips.</div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => alert('Generate store description (stub)')}>Generate</Button>
            <Button variant="ghost" onClick={() => alert('Translate description (stub)')}>Translate</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}