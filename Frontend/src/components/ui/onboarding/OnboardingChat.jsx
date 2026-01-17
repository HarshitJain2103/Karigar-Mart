import { useEffect, useRef, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Send, Loader2, RefreshCw } from "lucide-react";
import useVoiceSearch from "@/hooks/useVoiceSearch";
import { getApiUrl } from "@/lib/api";
import useAuthStore from "@/stores/authStore";
import useLanguageStore from "@/stores/languageStore";
import { useTranslation } from "@/hooks/useTranslation";
import useVoiceOnboarding from "@/hooks/useVoiceOnboarding";

export default function OnboardingChat({ draft, onApplyUpdates }) {
    const { t } = useTranslation();
    const token = useAuthStore((s) => s.token);
    const user = useAuthStore((s) => s.user);
    const language = useLanguageStore((s) => s.language || "en");

    const chatKey = `onboarding_chat_${user?.id || 'guest'}_${language}`;

    const defaultMessages = useMemo(() => ([
        {
            role: "ai",
            content: t('onboardingChat.welcome'),
        },
    ]), [t]);

    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem(chatKey);
            return saved ? JSON.parse(saved) : defaultMessages;
        } catch {
            return defaultMessages;
        }
    });
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isQuotaExhausted, setIsQuotaExhausted] = useState(false);

    const scrollRef = useRef(null);

    // Save messages to localStorage
    useEffect(() => {
        localStorage.setItem(chatKey, JSON.stringify(messages));
    }, [messages, chatKey]);

    const {
        displayText,
        aiText,
        setDisplayText,
        setAiText,
        startVoice,
        isListening,
    } = useVoiceOnboarding();

    useEffect(() => {
        if (displayText) setInput(displayText);
    }, [displayText]);


    useEffect(() => {
        setMessages(defaultMessages);
        localStorage.setItem(chatKey, JSON.stringify(defaultMessages));
        setIsQuotaExhausted(false);
    }, [language]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages, loading]);

    const sendMessage = async (text) => {
        if (!text.trim() || loading || isQuotaExhausted) return;

        setMessages((prev) => [...prev, { role: "user", content: text }]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch(getApiUrl("/api/onboarding/chat"), {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    message: text,
                    draft,
                    language,
                }),
            });

            const data = await res.json();

            if (data.response) {
                setMessages((prev) => [
                    ...prev,
                    { role: "ai", content: data.response },
                ]);
            }

            if (data.responseKey === "AI_LIMIT_REACHED") {
                setIsQuotaExhausted(true);
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "ai",
                        content: t('onboardingChat.aiLimitReached'),
                    },
                ]);
            }

            if (data.responseKey === "AI_GENERIC_ERROR") {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: "ai",
                        content: t('onboardingChat.somethingWentWrong'),
                    },
                ]);
            }

            if (data.updates && Object.keys(data.updates).length > 0) {
                onApplyUpdates(data.updates);
            }

        } catch (err) {
            console.error(err);
            setMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    content: t('onboardingChat.somethingWentWrong'),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleVoice = () => {
        startVoice();
    };

    const handleSend = () => {
        const textToSend =
            displayText?.trim() ||
            input.trim();

        if (!textToSend) return;

        if (textToSend === t('onboardingChat.helpButton')) return;

        sendMessage(textToSend);

        setInput("");
        setAiText("");
        setDisplayText("");
    };

    return (
        <div className="flex h-[100dvh] max-h-[100dvh] flex-col">

            <div className="border-b p-3 flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setMessages(defaultMessages);
                        localStorage.setItem(chatKey, JSON.stringify(defaultMessages));
                        setIsQuotaExhausted(false);
                    }}
                    title={t('onboardingChat.refreshChat')}
                >
                    <RefreshCw className="h-4 w-4" />
                </Button>
                <div>
                    <h3 className="text-sm font-semibold">{t('onboardingChat.title')}</h3>
                    <p className="text-xs text-muted-foreground">
                        {t('onboardingChat.subTitle')}
                    </p>
                </div>
            </div>


            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3"
            >
                <div className="space-y-3">
                    {messages.map((m, i) => (
                        <div
                            key={i}
                            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${m.role === "user"
                                ? "ml-auto bg-primary text-primary-foreground"
                                : "bg-muted"
                                }`}
                        >
                            {m.content}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {t('onboardingChat.thinking')}
                        </div>
                    )}
                </div>
            </div>


            <div className="border-t p-3 pb-[env(safe-area-inset-bottom)]">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => {
                            setInput(e.target.value);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") handleSend();
                        }}
                        placeholder={t('onboardingChat.placeHolder')}
                        disabled={loading || isQuotaExhausted}
                    />

                    <Button
                        variant={isListening ? "destructive" : "outline"}
                        size="icon"
                        onClick={handleVoice}
                        disabled={loading || isQuotaExhausted}
                    >
                        {isListening ? <MicOff /> : <Mic />}
                    </Button>

                    <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={loading || !input.trim() || isQuotaExhausted}
                    >
                        <Send />
                    </Button>
                </div>
                {isQuotaExhausted && (
                    <p className="text-xs text-muted-foreground mt-2">
                        {t('onboardingChat.quotaRefresh')}
                    </p>
                )}
            </div>
        </div>
    );
}