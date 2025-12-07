import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '@/lib/api';
import Spinner from '@/components/ui/Spinner';
import ReelCard from '@/components/ui/products/ReelCard';
import { ChevronUp, ChevronDown } from 'lucide-react';

export default function ReelsPage() {
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const containerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);
  const touchStartY = useRef(null);
  const touchEndY = useRef(null);

  // Fetch reels
  useEffect(() => {
    const fetchReels = async () => {
      try {
        setLoading(true);
        const response = await fetch(getApiUrl('/api/products/reels'));
        if (!response.ok) throw new Error('Failed to fetch reels');
        const data = await response.json();
        setReels(data.reels || data);
      } catch (err) {
        console.error('Reels fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReels();
  }, []);

  // Go to reel
  const goToReel = useCallback((index) => {
    if (index < 0 || index >= reels.length) return;
    setCurrentIndex(index);

    if (containerRef.current) {
      const element = containerRef.current.children[index];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [reels.length]);

  const handleNext = useCallback(() => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < reels.length) goToReel(nextIndex);
  }, [currentIndex, reels.length, goToReel]);

  const handlePrev = useCallback(() => {
    const prevIndex = currentIndex - 1;
    if (prevIndex >= 0) goToReel(prevIndex);
  }, [currentIndex, goToReel]);

  // Wheel scroll
  const handleWheel = useCallback((e) => {
    if (scrollTimeoutRef.current) return;

    if (e.deltaY > 0) handleNext();
    else if (e.deltaY < 0) handlePrev();

    scrollTimeoutRef.current = setTimeout(() => {
      scrollTimeoutRef.current = null;
    }, 400);
  }, [handleNext, handlePrev]);

  // Keyboard nav
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleNext, handlePrev]);

  // Touch swipe
  const onTouchStart = (e) => {
    touchStartY.current = e.changedTouches[0].clientY;
  };

  const onTouchEnd = (e) => {
    touchEndY.current = e.changedTouches[0].clientY;
    const diff = touchStartY.current - touchEndY.current;

    if (Math.abs(diff) < 40) return;
    if (diff > 0) handleNext();
    else handlePrev();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-screen bg-white overflow-hidden">
        <Spinner size="lg" text="Loading reels..." />
      </div>
    );
  }

  if (error || reels.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen w-screen bg-black overflow-hidden">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">No Reels Available</h2>
          <p className="text-gray-400">
            {error || 'Check back soon for amazing product videos!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-gray-100 overflow-hidden flex flex-col justify-center items-center pt-16"
      onWheel={handleWheel}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Reel container */}
      <div
        ref={containerRef}
        className="relative w-full max-w-md h-full aspect-[9/16] overflow-hidden"
      >
        {reels.map((reel, idx) => (
          <div
            key={reel._id || idx}
            className="h-full w-full flex-shrink-0"
          >
            <ReelCard
              reel={reel}
              isActive={idx === currentIndex}
              autoPlay={autoPlay}
            />
          </div>
        ))}
      </div>
    </div>
  );
}