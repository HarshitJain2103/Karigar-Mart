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
import { getApiUrl } from "@/lib/api";
import { useTranslation } from '@/hooks/useTranslation';

const API_CONTACT = getApiUrl('/api/contact');

export default function ContactPage() {
  const { t } = useTranslation();
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
    if (!form.name.trim()) e.name = t('contact.nameRequired');
    if (!isValidEmail(form.email)) e.email = t('contact.enterValidEmail');
    if (form.message.trim().length < messageMin) e.message = t('contact.messageMinChars');
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
      if (!res.ok) throw new Error(t('contact.messageError'));
      setSuccess(true);
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setServerError(err.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 mt-5 mb-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('contact.contactUs')}</h1>
        <p className="text-muted-foreground mt-2">
          {t('contact.contactUsDescription')}
        </p>
      </div>

      {/* Top info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="shadow-lg">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Mail className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm">
              <div className="font-semibold">{t('contact.email')}</div>
              <a href="mailto:jainharshit2132005@gmail.com" className="text-primary hover:underline">
                jainharshit2132005@gmail.com
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <Phone className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm">
              <div className="font-semibold">{t('contact.phone')}</div>
              <a href="tel:+919773960061" className="hover:underline">
                +91 97739 60061
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="rounded-md bg-primary/10 p-2">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            <div className="text-sm">
              <div className="font-semibold">{t('contact.address')}</div>
              <div className="text-muted-foreground">
                {t('contact.location')}
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
              <div className="font-semibold">{t('contact.hours')}</div>
              <div className="text-muted-foreground">{t('contact.businessHours')}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Contact form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('contact.sendMessage')}</CardTitle>
            </CardHeader>
            <CardContent>
              {success && (
                <div className="mb-4 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  {t('contact.messageSentSuccessfully')}
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
                    <label className="text-sm font-medium">{t('contact.name')}</label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder={t('contact.fullName')}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('contact.email')}</label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder={t('contact.emailPlaceholder')}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">{t('contact.subject')}</label>
                  <Input
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder={t('contact.howCanWeHelp')}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">{t('contact.message')}</label>
                  <Textarea
                    rows={6}
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    placeholder={t('contact.tellMore')}
                  />
                  {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  <Button type="submit" size="lg" disabled={!canSubmit}>
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t('contact.sending')}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" /> {t('contact.sendMessage')}
                      </>
                    )}
                  </Button>
                  <a
                    href={`mailto:jainharshit2132005@gmail.com?subject=${encodeURIComponent(form.subject || 'Support request')}&body=${encodeURIComponent(
                      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
                    )}`}
                    className="sm:ml-auto"
                  >
                    <Button variant="outline" size="lg">{t('contact.emailUsDirect')}</Button>
                  </a>
                </div>
              </form>

              <Separator className="my-6" />

              {/* FAQ */}
              <div>
                <h3 className="text-lg font-semibold mb-3">{t('contact.faqTitle')}</h3>
                <Accordion type="single" collapsible>
                  <AccordionItem value="a1">
                    <AccordionTrigger>{t('contact.faq1Question')}</AccordionTrigger>
                    <AccordionContent>
                      {t('contact.faq1Answer')}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="a2">
                    <AccordionTrigger>{t('contact.faq2Question')}</AccordionTrigger>
                    <AccordionContent>
                      {t('contact.faq2Answer')}
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="a3">
                    <AccordionTrigger>{t('contact.faq3Question')}</AccordionTrigger>
                    <AccordionContent>
                      {t('contact.faq3Answer')}
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
              <CardTitle>{t('contact.ourLocation')}</CardTitle>
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
                {t('contact.scheduleAppointment')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('contact.needQuickHelp')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="font-medium">{t('contact.email')}:</span>{' '}
                <a href="mailto:jainharshit2132005@gmail.com" className="text-primary hover:underline">
                  jainharshit2132005@gmail.com
                </a>
              </div>
              <div>
                <span className="font-medium">{t('contact.phone')}:</span>{' '}
                <a href="tel:+919773960061" className="hover:underline">
                  +91 97739 60061
                </a>
              </div>
              <div className="text-muted-foreground">
                {t('contact.responseTime')}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}