// Frontend/src/hooks/useVoiceSearch.js
import { useState, useRef } from 'react';

export default function useVoiceSearch() {
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState("English");
  const recognitionRef = useRef(null);

  const startVoiceSearch = () => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice search not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = lang.startsWith("English") ? "en-IN" : "hi-IN";
    recognition.onresult = (e) => setQuery(e.results[0][0].transcript);
    recognition.onerror = () => alert("Voice search error. Please try again.");
    recognition.start();
    recognitionRef.current = recognition;
  };

  return { query, setQuery, lang, setLang, startVoiceSearch };
}