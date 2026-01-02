import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Send, Loader2 } from "lucide-react";
import useVoiceSearch from "@/hooks/useVoiceSearch";
import { getApiUrl } from "@/lib/api";
import useAuthStore from "@/stores/authStore";
import useLanguageStore from "@/stores/languageStore";

export default function OnboardingChat({ draft, onApplyUpdates }) {
    const token = useAuthStore((s) => s.token);
    const user = useAuthStore((s) => s.user);
    const language = useLanguageStore((s) => s.language || "en");

    const chatKey = `onboarding_chat_${user?.id || 'guest'}`;

    const defaultMessages = [
        {
            role: "ai",
            content:
                "Hi! I’ll help you set up your store. You can type or speak naturally.",
        },
    ];

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

    const scrollRef = useRef(null);

    // Save messages to localStorage
    useEffect(() => {
        localStorage.setItem(chatKey, JSON.stringify(messages));
    }, [messages, chatKey]);

    const { startVoiceSearch, isListening } = useVoiceSearch();

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages, loading]);

    const sendMessage = async (text) => {
        if (!text.trim() || loading) return;

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

            if (!res.ok) throw new Error("AI request failed");

            const data = await res.json();

            setMessages((prev) => [
                ...prev,
                { role: "ai", content: data.response },
            ]);

            if (data.updates && Object.keys(data.updates).length > 0) {
                onApplyUpdates(data.updates);
            }
        } catch (err) {
            console.error(err);
            setMessages((prev) => [
                ...prev,
                {
                    role: "ai",
                    content:
                        "Sorry, something went wrong. Please try again in a moment.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleVoice = () => {
        startVoiceSearch((spokenText) => {
            sendMessage(spokenText);
        });
    };

    return (
        <div className="flex h-full flex-col">
            
            <div className="border-b p-3">
                <h3 className="text-sm font-semibold">AI Store Assistant</h3>
                <p className="text-xs text-muted-foreground">
                    Answer naturally — I’ll fill the form for you
                </p>
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
                            Thinking…
                        </div>
                    )}
                </div>
            </div>

            
            <div className="border-t p-3">
                <div className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") sendMessage(input);
                        }}
                        placeholder="Type or speak…"
                        disabled={loading}
                    />

                    <Button
                        variant={isListening ? "destructive" : "outline"}
                        size="icon"
                        onClick={handleVoice}
                        disabled={loading}
                    >
                        {isListening ? <MicOff /> : <Mic />}
                    </Button>

                    <Button
                        size="icon"
                        onClick={() => sendMessage(input)}
                        disabled={loading || !input.trim()}
                    >
                        <Send />
                    </Button>
                </div>
            </div>
        </div>
    );
}