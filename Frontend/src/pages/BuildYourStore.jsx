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
import { getApiUrl } from '@/lib/api';
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const token = useAuthStore((state) => state.token);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const availableSlots = max - images.length;
    if (files.length > availableSlots) {
      alert(t('buildStore.imageUploader.limitExceeded', { count: availableSlots }));
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
        <Button
          variant="outline"
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading || images.length >= max}
        >
          {isUploading ? t('buildStore.imageUploader.uploading') : t(single ? 'buildStore.imageUploader.uploadImage' : 'buildStore.imageUploader.uploadImages')}
        </Button>
        <div className="text-sm text-muted-foreground">{images.length}/{max}</div>
      </div>
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <div className="grid grid-cols-3 gap-2 mt-2 p-2 border rounded-lg bg-slate-50 max-h-48 overflow-y-auto min-h-[6rem]">
        {images.length === 0 && <div className="col-span-3 text-sm text-muted-foreground p-4 border-2 border-dashed rounded-lg text-center">{t('buildStore.imageUploader.noImages')}</div>}
        {images.map((url, i) => (
          <div key={i} className="relative rounded overflow-hidden border">
            <img src={url} alt={`upload-${i}`} className="w-full h-24 object-cover" />
            <button type="button" aria-label={t('common.remove')} className="absolute top-1 right-1 bg-white/80 rounded-full p-1 text-xs" onClick={() => onChange(images.filter((_, idx) => idx !== i))}>✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, onEdit, onRemove }) {
  const { t } = useTranslation();

  return (
    <div className="border rounded-lg p-3 bg-white flex gap-3 items-start">
      <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
        {product.imageURLs?.[0] ? <img src={product.imageURLs[0]} alt={product.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">{t('buildStore.productCard.noImage')}</div>}
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-semibold">{product.title || t('buildStore.productCard.untitled')}</div>
            <div className="text-sm text-muted-foreground">{product.description?.slice(0, 60)}...</div>
          </div>
          <div className="text-right">
            <div className="font-medium">{product.price ? `₹${product.price}` : t('common.notAvailable')}</div>
            <div className="text-sm text-muted-foreground">
              {t('buildStore.productCard.inStock', {
                count: product.inventory || 0,
              })}
            </div>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => onEdit(product)}>{t('buildStore.productCard.edit')}</Button>
          <Button size="sm" variant="ghost" type="button" onClick={() => onRemove(product.id)}>{t('buildStore.productCard.remove')}</Button>
        </div>
      </div>
    </div>
  );
}

export default function BuildYourStoreFull() {
  const { t } = useTranslation();
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
        const response = await fetch(getApiUrl('/api/categories'));
        if (!response.ok) throw new Error(t('buildStore.errors.categoriesFetchFailed'));
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error(err);
        setError(t('buildStore.errors.categoriesLoadFailed'));
      }
    };
    if (token) {
      fetchCategories();
    }
  }, [token, t]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const update = (k, v) => setDraft((p) => ({ ...p, [k]: v }));
  const updateNested = (path, val) => setDraft((p) => {
    const out = JSON.parse(JSON.stringify(p));
    let cur = out;
    for (let i = 0; i < path.length - 1; i++) {
      cur = cur[path[i]] = { ...cur[path[i]] };
    }
    cur[path[path.length - 1]] = val;
    return out;
  });

  const openNewProduct = () => {
    setEditingProduct({
      id: uid(),
      title: "",
      description: "",
      price: "",
      inventory: "",
      categoryId: "",
      imageURLs: []
    });
    setShowProductDialog(true);
  };

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
    if (!draft.storeName || !draft.city || !draft.state) return alert(t('buildStore.publish.validationBasicInfo'));
    if (!draft.products || draft.products.length === 0) return alert(t('buildStore.publish.validationProducts'));
    const badProduct = draft.products.find((p) => !p.title || !p.price || !p.categoryId);
    if (badProduct) return alert(t('buildStore.publish.validationProductDetails', { title: badProduct.title || t('buildStore.productCard.untitled') }));

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

      const profileResponse = await fetch(getApiUrl('/api/artisans'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profileData),
      });

      if (!profileResponse.ok) {
        const errData = await profileResponse.json();
        throw new Error(errData.message || t('buildStore.errors.profileCreationFailed'));
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

        const productResponse = await fetch(getApiUrl('/api/products'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(productData),
        });

        if (!productResponse.ok) {
          const errData = await productResponse.json();
          throw new Error(t('buildStore.errors.productCreationFailed', { title: product.title, message: errData.message }));
        }
      }

      alert(t('buildStore.publish.success'));
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
            <a href="/" className="text-xl font-bold">{t('buildStore.header.brandName')}</a>
            <div className="hidden md:block w-96">
              <Progress value={healthScore()} className="h-2" />
              <div className="text-xs text-muted-foreground mt-1">{t('buildStore.header.setupProgress', { progress: healthScore() })}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => {
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
                alert(t('buildStore.header.draftSaved'));
              } catch {
                alert(t('buildStore.header.saveFailed'));
              }
            }}>{t('buildStore.header.save')}</Button>
            <Button variant="ghost" onClick={() => alert(t('buildStore.header.helpStub'))}>{t('buildStore.header.help')}</Button>
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
                <h1 className="text-2xl font-bold">{t('buildStore.hero.title')}</h1>
                <p className="text-sm text-muted-foreground mt-1">{t('buildStore.hero.subtitle')}</p>
                <div className="mt-4 flex gap-3">
                  <Button onClick={() => { document.getElementById('wizard-start')?.scrollIntoView({ behavior: 'smooth' }); }}>{t('buildStore.hero.startBuilding')}</Button>
                  <Button variant="outline" onClick={() => alert(t('buildStore.hero.tutorialStub'))}>{t('buildStore.hero.watchTutorial')}</Button>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-gray-50 border rounded p-3 text-center text-sm">{t('buildStore.hero.quickTip')}</div>
              </div>
            </CardContent>
          </Card>

          <div id="wizard-start">
            <Tabs value={step} onValueChange={(v) => setStep(v)} className="w-full">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="lg:w-1/4">
                  <Card className="p-4">
                    <div className="text-sm font-semibold mb-3">{t('buildStore.steps.title')}</div>
                    <div className="flex flex-col gap-1">
                      <button className={`text-left w-full px-3 py-2 rounded text-sm ${step === 'identity' ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600'}`} onClick={() => setStep('identity')}>{t('buildStore.steps.identity')}</button>
                      <button className={`text-left w-full px-3 py-2 rounded text-sm ${step === 'about' ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600'}`} onClick={() => setStep('about')}>{t('buildStore.steps.about')}</button>
                      <button className={`text-left w-full px-3 py-2 rounded text-sm ${step === 'products' ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600'}`} onClick={() => setStep('products')}>{t('buildStore.steps.products')}</button>
                      <button className={`text-left w-full px-3 py-2 rounded text-sm ${step === 'media' ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600'}`} onClick={() => setStep('media')}>{t('buildStore.steps.media')}</button>
                      <button className={`text-left w-full px-3 py-2 rounded text-sm ${step === 'theme' ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600'}`} onClick={() => setStep('theme')}>{t('buildStore.steps.theme')}</button>
                      <button className={`text-left w-full px-3 py-2 rounded text-sm ${step === 'seo' ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600'}`} onClick={() => setStep('seo')}>{t('buildStore.steps.seo')}</button>
                      <button className={`text-left w-full px-3 py-2 rounded text-sm ${step === 'publish' ? 'bg-slate-100 font-semibold text-slate-800' : 'text-slate-600'}`} onClick={() => setStep('publish')}>{t('buildStore.steps.publish')}</button>
                    </div>
                    <Separator className="my-4" />
                    <div className="text-xs text-muted-foreground">{t('buildStore.steps.autosave')}</div>
                  </Card>
                </div>

                <div className="flex-1">
                  <TabsContent value="identity">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('buildStore.identity.title')}</CardTitle>
                        <CardDescription>{t('buildStore.identity.description')}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <Input value={draft.storeName} onChange={(e) => update('storeName', e.target.value)} placeholder={t('buildStore.identity.storeNamePlaceholder')} />
                        <Input value={draft.tagline} onChange={(e) => update('tagline', e.target.value)} placeholder={t('buildStore.identity.taglinePlaceholder')} />
                        <div className="flex gap-2">
                          <Input value={draft.city} onChange={(e) => update('city', e.target.value)} placeholder={t('buildStore.identity.cityPlaceholder')} />
                          <Input value={draft.state} onChange={(e) => update('state', e.target.value)} placeholder={t('buildStore.identity.statePlaceholder')} />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button onClick={() => setStep('about')}>{t('buildStore.common.next')}</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="about">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('buildStore.about.title')}</CardTitle>
                        <CardDescription>{t('buildStore.about.description')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Textarea value={draft.about} onChange={(e) => update('about', e.target.value)} placeholder={t('buildStore.about.placeholder')} className="min-h-[200px]" />
                        <div className="flex gap-2 justify-end mt-4">
                          <Button variant="outline" onClick={() => { alert(t('buildStore.about.aiStub')); }}>{t('buildStore.about.aiSuggest')}</Button>
                          <Button onClick={() => setStep('products')}>{t('buildStore.common.next')}</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="products">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('buildStore.products.title')}</CardTitle>
                        <CardDescription>{t('buildStore.products.description')}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-semibold">{t('buildStore.products.yourProducts', { count: (draft.products || []).length })}</div>
                          <Button onClick={openNewProduct}>{t('buildStore.products.addProduct')}</Button>
                        </div>
                        <div className="space-y-2">
                          {(draft.products || []).map((p) => <ProductCard key={p.id} product={p} onEdit={openEditProduct} onRemove={removeProduct} />)}
                          {(draft.products || []).length === 0 && <div className="text-center text-sm text-muted-foreground py-8 border-2 border-dashed rounded-lg">{t('buildStore.products.noProducts')}</div>}
                        </div>
                        <div className="flex justify-end pt-2"><Button onClick={() => setStep('media')}>{t('buildStore.common.next')}</Button></div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="media">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('buildStore.media.title')}</CardTitle>
                        <CardDescription>{t('buildStore.media.description')}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-base font-medium">{t('buildStore.media.heroImageLabel')}</Label>
                          <ImageUploader
                            images={draft.media.heroImageURL ? [draft.media.heroImageURL] : []}
                            onChange={(urls) => updateNested(['media', 'heroImageURL'], urls[0] || "")}
                            uploadType="profile/hero"
                            single={true}
                            max={1}
                          />
                        </div>
                        <div>
                          <Label className="text-base font-medium">{t('buildStore.media.galleryImagesLabel')}</Label>
                          <ImageUploader
                            images={draft.media.galleryImageURLs || []}
                            onChange={(urls) => updateNested(['media', 'galleryImageURLs'], urls)}
                            uploadType="profile/gallery"
                            max={8}
                          />
                        </div>
                        <div className="flex justify-end pt-2">
                          <Button onClick={() => setStep('theme')}>{t('buildStore.common.next')}</Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="theme">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('buildStore.theme.title')}</CardTitle>
                        <CardDescription>{t('buildStore.theme.description')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4 items-center">
                          <Label>{t('buildStore.theme.presetLabel')}</Label>
                          <Select onValueChange={(v) => updateNested(['theme', 'preset'], v)} defaultValue={draft.theme.preset}>
                            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="modern">{t('buildStore.theme.presets.modern')}</SelectItem>
                              <SelectItem value="classic">{t('buildStore.theme.presets.classic')}</SelectItem>
                              <SelectItem value="minimal">{t('buildStore.theme.presets.minimal')}</SelectItem>
                              <SelectItem value="rustic">{t('buildStore.theme.presets.rustic')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end pt-4"><Button onClick={() => setStep('seo')}>{t('buildStore.common.next')}</Button></div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="seo">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('buildStore.seo.title')}</CardTitle>
                        <CardDescription>{t('buildStore.seo.description')}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-1">
                          <Label htmlFor="meta-desc">{t('buildStore.seo.metaDescriptionLabel')}</Label>
                          <Textarea id="meta-desc" placeholder={t('buildStore.seo.metaDescriptionPlaceholder')} value={draft.seo.metaDescription} onChange={(e) => updateNested(['seo', 'metaDescription'], e.target.value)} />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="keywords">{t('buildStore.seo.keywordsLabel')}</Label>
                          <Input id="keywords" placeholder={t('buildStore.seo.keywordsPlaceholder')} value={(draft.seo.keywords || []).join(', ')} onChange={(e) => updateNested(['seo', 'keywords'], e.target.value.split(',').map(s => s.trim()))} />
                        </div>
                        <div className="flex justify-end pt-2"><Button onClick={() => setStep('publish')}>{t('buildStore.common.next')}</Button></div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="publish">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('buildStore.publish.title')}</CardTitle>
                        <CardDescription>{t('buildStore.publish.description')}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="p-4 border rounded-lg bg-white">
                          <h4 className="font-semibold mb-3">{t('buildStore.publish.checklistTitle')}</h4>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">{draft.storeName ? '✅' : '❌'} {t('buildStore.publish.checklistStoreName')}</li>
                            <li className="flex items-center gap-2">{draft.city && draft.state ? '✅' : '❌'} {t('buildStore.publish.checklistLocation')}</li>
                            <li className="flex items-center gap-2">{(draft.products || []).length > 0 ? '✅' : '❌'} {t('buildStore.publish.checklistProducts')}</li>
                            <li className="flex items-center gap-2">{draft.about ? '✅' : '❌'} {t('buildStore.publish.checklistAbout')}</li>
                          </ul>
                          <Progress value={healthScore()} className="mt-4 h-2" />
                        </div>
                        <div className="mt-6 flex gap-3 justify-end">
                          <Button onClick={publish} disabled={isLoading}>
                            {isLoading ? t('buildStore.publish.publishing') : t('buildStore.publish.publishButton')}
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
            <CardHeader><CardTitle>{t('buildStore.preview.title')}</CardTitle></CardHeader>
            <CardContent>
              <div className="flex justify-center gap-2 mb-4">
                <Button size="sm" variant={previewMode === 'desktop' ? 'secondary' : 'outline'} onClick={() => setPreviewMode('desktop')}>{t('buildStore.preview.desktop')}</Button>
                <Button size="sm" variant={previewMode === 'mobile' ? 'secondary' : 'outline'} onClick={() => setPreviewMode('mobile')}>{t('buildStore.preview.mobile')}</Button>
              </div>
              <div className={`border-2 rounded-lg bg-white mx-auto transition-all duration-300 ${previewMode === 'mobile' ? 'w-full w-max[355px] h-[667px]' : 'w-full h-[400px]'}`}>
                <div className="w-full h-1/3 bg-gray-200 flex items-center justify-center text-muted-foreground">
                  {draft.media.heroImageURL ? <img src={draft.media.heroImageURL} alt={t('buildStore.preview.heroAlt')} className="w-full h-full object-cover" /> : t('buildStore.preview.heroPlaceholder')}
                </div>
                <div className="p-4">
                  <h3 className="text-xl font-bold">{draft.storeName || t('buildStore.preview.storeNamePlaceholder')}</h3>
                  <p className="text-sm text-muted-foreground">{draft.tagline || t('buildStore.preview.taglinePlaceholder')}</p>
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
                    {(draft.products || []).length === 0 && <div className="text-xs text-muted-foreground text-center py-4">{t('buildStore.preview.productsPlaceholder')}</div>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{t('buildStore.assistant.title')}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-3">{t('buildStore.assistant.description')}</div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { alert(t('buildStore.assistant.autoDescribeStub')); }}>{t('buildStore.assistant.autoDescribe')}</Button>
                <Button variant="outline" onClick={() => { alert(t('buildStore.assistant.translateStub')); }}>{t('buildStore.assistant.translate')}</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProduct?.id && editingProduct.title ? t('buildStore.productDialog.editTitle') : t('buildStore.productDialog.addTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-1">
              <Label htmlFor="product-title">{t('buildStore.productDialog.titleLabel')}</Label>
              <Input id="product-title" placeholder={t('buildStore.productDialog.titlePlaceholder')} value={editingProduct?.title || ''} onChange={(e) => setEditingProduct(prev => ({ ...prev, title: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="product-desc">{t('buildStore.productDialog.descriptionLabel')}</Label>
              <Textarea id="product-desc" placeholder={t('buildStore.productDialog.descriptionPlaceholder')} value={editingProduct?.description || ''} onChange={(e) => setEditingProduct(prev => ({ ...prev, description: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label htmlFor="category">{t('buildStore.productDialog.categoryLabel')}</Label>
              <Select
                value={editingProduct?.categoryId || ""}
                onValueChange={(value) => setEditingProduct(prev => ({ ...prev, categoryId: value }))}
                required
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder={t('buildStore.productDialog.categoryPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.length === 0 && <SelectItem value="loading" disabled>{t('buildStore.productDialog.categoryLoading')}</SelectItem>}
                  {categories.map(cat => (
                    <SelectItem key={cat._id} value={cat._id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="product-price">{t('buildStore.productDialog.priceLabel')}</Label>
                <Input id="product-price" placeholder={t('buildStore.productDialog.pricePlaceholder')} type="number" value={editingProduct?.price || ''} onChange={(e) => setEditingProduct(prev => ({ ...prev, price: e.target.value }))} required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="product-inv">{t('buildStore.productDialog.inventoryLabel')}</Label>
                <Input id="product-inv" placeholder={t('buildStore.productDialog.inventoryPlaceholder')} type="number" value={editingProduct?.inventory || ''} onChange={(e) => setEditingProduct(prev => ({ ...prev, inventory: e.target.value }))} required />
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">{t('buildStore.productDialog.imagesLabel')}</div>
              <ImageUploader
                images={editingProduct?.imageURLs || []}
                onChange={(urls) => setEditingProduct(prev => ({ ...prev, imageURLs: urls }))}
                uploadType="products"
                max={8}
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" type="button" onClick={() => { setShowProductDialog(false); setEditingProduct(null); }}>{t('buildStore.productDialog.cancel')}</Button>
              <Button type="button" onClick={() => { if (!editingProduct) return; saveProduct(editingProduct); }}>{t('buildStore.productDialog.save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet>
        <SheetTrigger asChild>
          <Button className="fixed bottom-6 right-6 shadow-lg rounded-full h-14 w-14 font-semibold">{t('buildStore.floatingAssistant.buttonLabel')}</Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-96 p-6">
          <h3 className="text-lg font-semibold">{t('buildStore.floatingAssistant.title')}</h3>
          <div className="text-sm text-muted-foreground mt-2">{t('buildStore.floatingAssistant.description')}</div>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => alert(t('buildStore.floatingAssistant.generateStub'))}>{t('buildStore.floatingAssistant.generate')}</Button>
            <Button variant="ghost" onClick={() => alert(t('buildStore.floatingAssistant.translateStub'))}>{t('buildStore.floatingAssistant.translate')}</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}