import { useState, useEffect, useRef } from 'react';

export default function useVoiceSearch() {
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState("English");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = lang.startsWith("English") ? "en-IN" : "hi-IN";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event) => {
      let transcript = event.results[0][0].transcript;
      if (transcript.endsWith('.')) {
        transcript = transcript.slice(0, -1);
      }
      setQuery(transcript);
      if (recognition.onSubmit) {
        recognition.onSubmit(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false); 
    };

    recognitionRef.current = recognition;
    
  }, [lang]);

  const startVoiceSearch = (onSubmit) => {
    if (recognitionRef.current && !isListening) {
      recognitionRef.current.onSubmit = onSubmit;
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error("Could not start voice search:", error);
      }
    }
  };
  return { query, setQuery, lang, setLang, startVoiceSearch, isListening };
}