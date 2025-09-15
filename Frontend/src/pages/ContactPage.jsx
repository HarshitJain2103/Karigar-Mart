// /frontend/src/pages/ContactPage.jsx
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const API_CONTACT = 'http://localhost:8000/api/contact';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(v.trim());
  const messageMin = 10;

  const canSubmit = useMemo(() => {
    return (
      form.name.trim() &&
      isValidEmail(form.email) &&
      form.message.trim().length >= messageMin &&
      !submitting
    );
  }, [form, submitting]);

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!isValidEmail(form.email)) e.email = 'Enter a valid email';
    if (form.message.trim().length < messageMin) e.message = `Message must be at least ${messageMin} characters`;
    return e;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError('');
    const eMap = validate();
    setErrors(eMap);
    if (Object.keys(eMap).length) return;

    setSubmitting(true);
    try {
      const res = await fetch(API_CONTACT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to submit. Please try again.');
      setSuccess(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setServerError(err.message || 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto py-12 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Contact Us</h1>
        <p className="text-muted-foreground mt-2">
          We’d love to hear from you. We usually respond within 24–48 hours.
        </p>
      </div>

      {/* Top info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm">
              <div className="font-semibold">Email</div>
              <a href="mailto:jainharshit2132005@gmail.com" className="text-primary hover:underline">
                jainharshit2132005@gmail.com
              </a>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm">
              <div className="font-semibold">Phone</div>
              <a href="tel:+919773960061" className="hover:underline">
                +91 97739 60061
              </a>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm">
              <div className="font-semibold">Address</div>
              <div className="text-muted-foreground">
                Delhi, India
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm">
              <div className="font-semibold">Hours</div>
              <div className="text-muted-foreground">Mon–Sat, 10:00–18:00 IST</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Contact form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Send us a message</CardTitle>
            </CardHeader>
            <CardContent>
              {success && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Message sent successfully. We’ll get back to you soon.
                </div>
              )}
              {serverError && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  {serverError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Name</label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Your full name"
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="name@example.com"
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Subject</label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Message</label>
                  <Textarea
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder="Tell us more about your query..."
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Button type="submit" size="lg" disabled={!canSubmit}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" /> Send Message
                      </>
                    )}
                  </Button>
                  <a
                    href={`mailto:jainharshit2132005@gmail.com?subject=${encodeURIComponent(form.subject || 'Support request')}&body=${encodeURIComponent(
                      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
                    )}`}
                    className="sm:ml-auto"
                  >
                    <Button variant="outline" size="lg">Email us directly</Button>
                  </a>
                </div>
              </form>

              <Separator className="my-6" />

              {/* FAQ */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Frequently asked questions</h3>
                <Accordion type="single" collapsible>
                  <AccordionItem value="a1">
                    <AccordionTrigger>What is the usual delivery time?</AccordionTrigger>
                    <AccordionContent>
                      Orders are typically delivered within 2–5 business days depending on your location and the product.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="a2">
                    <AccordionTrigger>What is your return policy?</AccordionTrigger>
                    <AccordionContent>
                      We offer a 7-day return policy on eligible items. Please ensure the product is unused and in original packaging.
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="a3">
                    <AccordionTrigger>How can I track my order?</AccordionTrigger>
                    <AccordionContent>
                      After your order ships, you’ll receive a tracking link via email. You can also view it in the My Orders page.
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Map and quick info */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Our location</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md overflow-hidden border">
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    title="Map"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1945.2740552172207!2d77.5946!3d12.9716!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTLCsDU4JzE3LjciTiA3N8KwMzUnNDEuNiJF!5e0!3m2!1sen!2sin!4v1699999999999"
                    width="600"
                    height="450"
                    style={{ border: 0, position: 'absolute', inset: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                If visiting, please schedule an appointment in advance.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Need quick help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Email:</span>{' '}
                <a href="mailto:jainharshit2132005@gmail.com" className="text-primary hover:underline">
                  jainharshit2132005@gmail.com
                </a>
              </div>
              <div>
                <span className="font-medium">Phone:</span>{' '}
                <a href="tel:+919773960061" className="hover:underline">
                  +91 97739 60061
                </a>
              </div>
              <div className="text-muted-foreground">
                Response typically within 24–48 hours (Mon–Sat).
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}