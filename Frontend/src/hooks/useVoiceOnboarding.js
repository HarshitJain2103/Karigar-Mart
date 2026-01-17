import { useState, useEffect, useRef } from "react";
import { transliterateToHindi } from "@/lib/transliteration";
import useLanguageStore from "@/stores/languageStore";

export default function useVoiceOnboarding() {
  const [displayText, setDisplayText] = useState("");
  const [aiText, setAiText] = useState("");
  const [isListening, setIsListening] = useState(false);

  const recognitionRef = useRef(null);
  const { language } = useLanguageStore();

  useEffect(() => {
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = async (e) => {
      let text = e.results[0][0].transcript.trim();
      if (!text) return;

      setAiText(text);

      if (language === "hi") {
        const hindi = await transliterateToHindi(text);
        setDisplayText(hindi);
      } else {
        setDisplayText(text);
      }
    };

    recognitionRef.current = recognition;
  }, [language]);

  const startVoice = () => {
    if (!isListening && recognitionRef.current) {
      recognitionRef.current.abort?.();
      recognitionRef.current.start();
    }
  };

  return {
    displayText,
    aiText,
    setDisplayText,
    setAiText,
    startVoice,
    isListening,
  };
}