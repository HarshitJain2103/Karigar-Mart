import React, { useEffect, useRef, useState } from "react";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Full-featured Build Your Store page (React + Tailwind + shadcn/ui)
// - Multi-step wizard
// - Autosave to localStorage
// - AI assistant stub (Sheet)
// - Live preview (mobile/desktop toggle)
// - Product editor with image preview (base64)
// Note: Replace `@/components/ui/*` imports with your shadcn UI components path.

const STORAGE_KEY = "karigar.store.v1";
const defaultDraft = {
  name: "",
  tagline: "",
  owner: "",
  city: "",
  state: "",
  languages: [],
  craft: "",
  story: "",
  media: { logo: "", hero: "", gallery: [] },
  theme: { preset: "modern", color: "#0f172a" },
  seo: { meta: "", keywords: [] },
  payments: { gateways: [], gstNumber: "" },
  shipping: { options: [] },
  products: [],
  status: "draft",
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function readFilesAsDataUrls(files) {
  return Promise.all(
    Array.from(files).map((f) =>
      new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = (e) => res(e.target.result);
        r.onerror = rej;
        r.readAsDataURL(f);
      })
    )
  );
}

function ImageUploader({ images = [], onChange, max = 6, single = false }) {
  const input = useRef(null);
  async function handle(e) {
    const files = e.target.files;
    if (!files) return;
    const urls = await readFilesAsDataUrls(files);
    if (single) onChange(urls[0] || "");
    else onChange([...images, ...urls].slice(0, max));
    if (input.current) input.current.value = null;
  }
  return (
    <div className="space-y-2">
      <input ref={input} id={`file-${uid()}`} type="file" accept="image/*" multiple={!single} onChange={handle} className="hidden" />
      <label htmlFor={input?.current?.id || "file-input"}>
        {/* We cannot reliably reference dynamic id in label here; use a simple button trigger instead */}
      </label>
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => input.current?.click()}>Upload {single ? "image" : "images"}</Button>
        <div className="text-sm text-muted-foreground">{images.length}/{max}</div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-2">
        {images.length === 0 && <div className="col-span-3 text-sm text-muted-foreground">No images yet</div>}
        {images.map((s, i) => (
          <div key={i} className="relative rounded overflow-hidden border bg-white">
            <img src={s} alt={`img-${i}`} className="w-full h-24 object-cover" />
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
        {product.images?.[0] ? <img src={product.images[0]} alt="prod" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No image</div>}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-semibold">{product.title || "Untitled"}</div>
            <div className="text-sm text-muted-foreground">{product.description?.slice(0,60)}</div>
          </div>
          <div className="text-right">
            <div className="font-medium">{product.price ? `₹${product.price}` : "—"}</div>
            <div className="text-sm text-muted-foreground">{product.inventory || "—"}</div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(product)}>Edit</Button>
          <Button size="sm" variant="ghost" onClick={() => onRemove(product.id)}>Remove</Button>
        </div>
      </div>
    </div>
  );
}

export default function BuildYourStoreFull() {
  const saved = (() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || null; } catch { return null; }
  })();

  const [draft, setDraft] = useState(saved || defaultDraft);
  const [step, setStep] = useState("identity");
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [previewMode, setPreviewMode] = useState("desktop");

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch (e) { console.warn(e); }
  }, [draft]);

  const update = (k, v) => setDraft((p) => ({ ...p, [k]: v }));
  const updateNested = (path, val) => setDraft((p) => {
    const out = { ...p };
    let cur = out;
    for (let i = 0; i < path.length-1; i++) { cur = cur[path[i]] = { ...cur[path[i]] }; }
    cur[path[path.length-1]] = val;
    return out;
  });

  // products
  const openNewProduct = () => { setEditingProduct({ id: uid(), title: "", description: "", price: "", inventory: "", images: [] }); setShowProductDialog(true); };
  const openEditProduct = (p) => { setEditingProduct(p); setShowProductDialog(true); };
  const saveProduct = (prod) => {
    setDraft((prev) => {
      const exists = (prev.products || []).some((x) => x.id === prod.id);
      return {
        ...prev,
        products: exists ? prev.products.map((x) => x.id === prod.id ? prod : x) : [...(prev.products||[]), prod],
      };
    });
    setShowProductDialog(false);
    setEditingProduct(null);
  };
  const removeProduct = (id) => setDraft((p) => ({ ...p, products: (p.products||[]).filter((x) => x.id !== id) }));

  const healthScore = () => {
    let score = 0;
    if (draft.name) score += 20;
    if (draft.city && draft.state) score += 10;
    if (draft.products?.length > 0) score += 30;
    if (draft.products?.some((p) => p.images?.length >= 1)) score += 20;
    if (draft.story) score += 20;
    return Math.min(100, score);
  };

  const publish = () => {
    if (!draft.name || !draft.city || !draft.state) return alert("Please add store name, city and state before publishing.");
    if (!draft.products || draft.products.length === 0) return alert("Add at least one product to publish.");
    const bad = draft.products.find((p) => !p.title || !p.price);
    if (bad) return alert("Every product needs a title and price.");
    setDraft((p) => ({ ...p, status: "published" }));
    alert("Published (frontend simulation)");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <a href="/" className="text-xl font-bold">ArtisanMarket</a>
            <div className="hidden md:block w-96">
              <div className="h-2 bg-gray-100 rounded overflow-hidden">
                <div style={{ width: `${healthScore()}%` }} className="h-2 bg-emerald-500" />
              </div>
              <div className="text-xs text-muted-foreground mt-1">Setup progress: {healthScore()}%</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); alert('Draft saved locally'); } catch { alert('Save failed'); } }}>Save</Button>
            <Button variant="ghost" onClick={() => { /* open help */ alert('Open help (AI assistant)') }}>Help</Button>
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">U</div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Wizard (col-span 8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Hero */}
          <Card>
            <CardContent className="grid md:grid-cols-3 gap-4 items-center">
              <div className="md:col-span-2">
                <h1 className="text-2xl font-bold">Bring Your Craft Online — Build Your Store in Minutes</h1>
                <p className="text-sm text-muted-foreground mt-1">We’ll guide you step-by-step. Use the AI assistant (right) anytime for suggestions.</p>
                <div className="mt-4 flex gap-3">
                  <Button onClick={() => { document.getElementById('wizard-start')?.scrollIntoView({ behavior: 'smooth' }); }}>Start Building</Button>
                  <Button variant="outline" onClick={() => alert('Open tutorial (stub)')}>Watch Tutorial</Button>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-gray-50 border rounded p-3 text-center">Quick tips: Use 3 photos per product for best results</div>
              </div>
            </CardContent>
          </Card>

          {/* Wizard */}
          <div id="wizard-start">
            <Tabs value={step} onValueChange={(v) => setStep(v)}>
              <div className="flex gap-6">
                <div className="w-1/4 hidden lg:block">
                  <Card className="p-4">
                    <div className="text-sm font-semibold mb-3">Steps</div>
                    <div className="flex flex-col gap-2">
                      <button className={`text-left px-2 py-1 rounded ${step==='identity'?'bg-emerald-50':''}`} onClick={()=>setStep('identity')}>1. Identity</button>
                      <button className={`text-left px-2 py-1 rounded ${step==='story'?'bg-emerald-50':''}`} onClick={()=>setStep('story')}>2. Story</button>
                      <button className={`text-left px-2 py-1 rounded ${step==='products'?'bg-emerald-50':''}`} onClick={()=>setStep('products')}>3. Products</button>
                      <button className={`text-left px-2 py-1 rounded ${step==='media'?'bg-emerald-50':''}`} onClick={()=>setStep('media')}>4. Media</button>
                      <button className={`text-left px-2 py-1 rounded ${step==='theme'?'bg-emerald-50':''}`} onClick={()=>setStep('theme')}>5. Theme</button>
                      <button className={`text-left px-2 py-1 rounded ${step==='seo'?'bg-emerald-50':''}`} onClick={()=>setStep('seo')}>6. Marketing</button>
                      <button className={`text-left px-2 py-1 rounded ${step==='publish'?'bg-emerald-50':''}`} onClick={()=>setStep('publish')}>7. Publish</button>
                    </div>
                    <Separator className="my-3" />
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
                        <Input value={draft.name} onChange={(e)=>update('name', e.target.value)} placeholder="Store name" />
                        <Input value={draft.tagline} onChange={(e)=>update('tagline', e.target.value)} placeholder="Tagline (AI suggest)" />
                        <div className="flex gap-2">
                          <Input value={draft.city} onChange={(e)=>update('city', e.target.value)} placeholder="City" />
                          <Input value={draft.state} onChange={(e)=>update('state', e.target.value)} placeholder="State" />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button onClick={()=>setStep('story')}>Next</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="story">
                    <Card>
                      <CardHeader>
                        <CardTitle>Storytelling & About</CardTitle>
                        <CardDescription>Tell your craft story — AI will help refine it.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Textarea value={draft.story} onChange={(e)=>update('story', e.target.value)} placeholder="Write your story here" />
                        <div className="flex gap-2 mt-3">
                          <Button onClick={()=>{ const tagline = draft.name && draft.craft ? `${draft.name} — handmade ${draft.craft} from ${draft.city || 'your region'}` : 'Handmade with love'; update('tagline', tagline); alert('Tagline suggested (stub)'); }}>Suggest tagline</Button>
                          <Button variant="ghost" onClick={()=>setStep('products')}>Next</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="products">
                    <Card>
                      <CardHeader>
                        <CardTitle>Product Catalog</CardTitle>
                        <CardDescription>Add products one by one or bulk upload</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">Products: {(draft.products||[]).length}</div>
                          <div className="flex gap-2">
                            <Button onClick={openNewProduct}>+ Add Product</Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {(draft.products||[]).map((p)=> <ProductCard key={p.id} product={p} onEdit={openEditProduct} onRemove={removeProduct} />)}
                          {(draft.products||[]).length===0 && <div className="text-sm text-muted-foreground">No products yet</div>}
                        </div>

                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" onClick={()=>setStep('media')}>Next</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="media">
                    <Card>
                      <CardHeader>
                        <CardTitle>Media & Branding</CardTitle>
                        <CardDescription>Upload hero image and gallery</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="text-sm font-medium">Hero image</div>
                          <ImageUploader images={draft.media?.hero ? [draft.media.hero] : []} onChange={(imgs)=>updateNested(['media','hero'], imgs[0]||"")} single={true} max={1} />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Gallery</div>
                          <ImageUploader images={draft.media?.gallery||[]} onChange={(imgs)=>updateNested(['media','gallery'], imgs)} max={8} />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button onClick={()=>setStep('theme')}>Next</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="theme">
                    <Card>
                      <CardHeader>
                        <CardTitle>Appearance</CardTitle>
                        <CardDescription>Theme presets and primary color</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-3 items-center">
                          <Select onValueChange={(v)=>updateNested(['theme','preset'], v)}>
                            <SelectTrigger className="w-48"><SelectValue placeholder={draft.theme.preset} /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="modern">Modern</SelectItem>
                              <SelectItem value="classic">Classic</SelectItem>
                              <SelectItem value="minimal">Minimal</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input value={draft.theme.color} onChange={(e)=>updateNested(['theme','color'], e.target.value)} type="color" className="w-12 h-10 p-0" />
                        </div>
                        <div className="flex gap-2 justify-end mt-4">
                          <Button onClick={()=>setStep('seo')}>Next</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="seo">
                    <Card>
                      <CardHeader>
                        <CardTitle>Marketing & SEO</CardTitle>
                        <CardDescription>AI will help suggest keywords and social posts</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Input placeholder="Meta description" value={draft.seo.meta} onChange={(e)=>updateNested(['seo','meta'], e.target.value)} />
                        <Input placeholder="Keywords, comma separated" value={(draft.seo.keywords||[]).join(', ')} onChange={(e)=>updateNested(['seo','keywords'], e.target.value.split(',').map(s=>s.trim()))} />
                        <div className="flex gap-2 justify-end mt-2">
                          <Button onClick={()=>setStep('publish')}>Next</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="publish">
                    <Card>
                      <CardHeader>
                        <CardTitle>Review & Publish</CardTitle>
                        <CardDescription>Preview and publish your store</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-semibold">Store Health</h4>
                            <ul className="mt-2 space-y-1 text-sm">
                              <li>{draft.name? '✅' : '❌' } Store name</li>
                              <li>{draft.city && draft.state? '✅' : '❌' } Location</li>
                              <li>{(draft.products||[]).length>0? '✅' : '❌'} At least one product</li>
                              <li>{(draft.products||[]).some(p => p.images?.length>=1)? '✅' : '❌'} Product images</li>
                            </ul>
                            <div className="mt-4">
                              <Progress value={healthScore()} />
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold">Preview</h4>
                            <div className="mt-2"><div className="border rounded p-3 bg-white">Preview panel (use right column for full preview)</div></div>
                          </div>
                        </div>

                        <div className="mt-4 flex gap-3 justify-end">
                          <Button onClick={publish}>Publish Store</Button>
                          <Button variant="ghost" onClick={()=>{ navigator.clipboard?.writeText(window.location.href); alert('Preview link copied (simulation)'); }}>Copy preview link</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                </div>
              </div>
            </Tabs>
          </div>
        </div>

        {/* Right: Live Preview + Assistant (col-span 4) */}
        <div className="lg:col-span-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Live Store Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 items-center mb-3">
                <Button size="sm" variant={previewMode==='desktop'? 'default':'ghost'} onClick={()=>setPreviewMode('desktop')}>Desktop</Button>
                <Button size="sm" variant={previewMode==='mobile'? 'default':'ghost'} onClick={()=>setPreviewMode('mobile')}>Mobile</Button>
              </div>

              <div className={`border rounded-lg bg-white ${previewMode==='mobile' ? 'w-80 h-[600px] mx-auto' : 'w-full h-[320px]' } overflow-hidden`}>
                {draft.media?.hero ? <img src={draft.media.hero} className="w-full h-full object-cover" /> : (
                  <div className="p-6 text-center">
                    <h3 className="text-lg font-semibold">{draft.name || 'Your Store Name'}</h3>
                    <p className="text-sm text-muted-foreground">{draft.tagline || 'A short tagline will appear here'}</p>
                  </div>
                )}
              </div>

              <div className="mt-3 space-y-2">
                {(draft.products||[]).slice(0,3).map(p=> (
                  <div key={p.id} className="border rounded p-2 bg-white flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">{p.images?.[0] && <img src={p.images[0]} className="w-full h-full object-cover"/>}</div>
                    <div className="flex-1">
                      <div className="font-medium">{p.title}</div>
                      <div className="text-sm text-muted-foreground">{p.price? `₹${p.price}` : ''}</div>
                    </div>
                    <Button size="sm">View</Button>
                  </div>
                ))}
                {(draft.products||[]).length===0 && <div className="text-sm text-muted-foreground">No products yet — add one to preview.</div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Assistant</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">Ask the assistant to generate descriptions, tags, or social posts.</div>
                <div className="flex gap-2">
                  <Button onClick={()=>{ /* generate descriptions stub */ alert('Generated descriptions (stub)'); }}>Auto-describe</Button>
                  <Button variant="ghost" onClick={()=>{ /* translate stub */ alert('Translated to Hindi (stub)'); }}>Translate</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resources & Learning</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>How to take better product photos</li>
                <li>Pricing your crafts</li>
                <li>Shipping and packaging tips</li>
              </ul>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Product Dialog (accessible) */}
      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct?.id ? 'Edit product' : 'Add product'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Product title" value={editingProduct?.title||''} onChange={(e)=>setEditingProduct(prev=>({...prev, title: e.target.value}))} />
            <Textarea placeholder="Description" value={editingProduct?.description||''} onChange={(e)=>setEditingProduct(prev=>({...prev, description: e.target.value}))} />
            <div className="flex gap-2">
              <Input placeholder="Price" value={editingProduct?.price||''} onChange={(e)=>setEditingProduct(prev=>({...prev, price: e.target.value}))} />
              <Input placeholder="Inventory" value={editingProduct?.inventory||''} onChange={(e)=>setEditingProduct(prev=>({...prev, inventory: e.target.value}))} />
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Images</div>
              <ImageUploader images={editingProduct?.images||[]} onChange={(imgs)=>setEditingProduct(prev=>({...prev, images: imgs}))} max={6} />
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={()=>{ if(!editingProduct) return; saveProduct(editingProduct); }}>Save Product</Button>
              <Button variant="ghost" onClick={()=>{ setShowProductDialog(false); setEditingProduct(null); }}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating assistant sheet for small screens */}
      <Sheet>
        <SheetTrigger asChild>
          <Button className="fixed bottom-6 right-6 shadow-lg">Karigar Assistant</Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-96 p-4">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Karigar Assistant</h3>
            <div className="text-sm text-muted-foreground">Generate content, translate, and get tips.</div>
            <div className="flex gap-2">
              <Button onClick={()=>alert('Generate store description (stub)')}>Generate</Button>
              <Button variant="ghost" onClick={()=>alert('Translate description (stub)')}>Translate</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
