import { useState, useEffect, useRef } from "react";
import { transliterateToHindi } from "../lib/transliteration";
import useLanguageStore from "@/stores/languageStore";

export default function useVoiceSearch() {
  const [displayQuery, setDisplayQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const { language } = useLanguageStore();

  useEffect(() => {
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.lang = "en-IN";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = async (event) => {
      let transcript = event.results[0][0].transcript.trim();

      if (transcript.endsWith(".")) {
        transcript = transcript.slice(0, -1);
      }

      setSearchQuery(transcript);

      if (language === "hi") {
        const hindiText = await transliterateToHindi(transcript);
        setDisplayQuery(hindiText);
      } else {
        setDisplayQuery(transcript);
      }

      recognition.onSubmit?.(transcript);

    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, [language]);

  const startVoiceSearch = (onSubmit) => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.onSubmit = onSubmit;
      try {
        recognitionRef.current.abort?.();
        recognitionRef.current.start();
      } catch (error) {
        console.error("Could not start voice search:", error);
      }
    }
  };

  return {
    displayQuery,
    setDisplayQuery,
    searchQuery,
    setSearchQuery,
    startVoiceSearch,
    isListening,
  };
}