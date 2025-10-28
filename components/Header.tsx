import React, { useState } from 'react';
import { dailyVerses } from '../constants/constants';

interface HeaderProps {
  title: string;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const initialVerse = dailyVerses[new Date().getDate() % dailyVerses.length];
  const [currentVerse, setCurrentVerse] = useState(initialVerse);
  const [isGeneratingVerse, setIsGeneratingVerse] = useState(false);

  const handleGenerateVerse = () => {
    setIsGeneratingVerse(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * dailyVerses.length);
      const newVerse = dailyVerses[randomIndex];
      setCurrentVerse(newVerse);
      setIsGeneratingVerse(false);
    }, 400); // 小延遲讓按鈕動畫更自然
  };

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-20 p-4 bg-beige-200 shadow-md text-center">
      <div className="flex justify-between items-center">
        <button
          onClick={handleGenerateVerse}
          disabled={isGeneratingVerse}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-beige-300 focus:outline-none focus:ring-2 focus:ring-gold-DEFAULT disabled:opacity-50"
          aria-label="Generate a new random verse"
        >
          <span>{isGeneratingVerse ? '⟳' : '⟳'}</span>
        </button>
        <h1 className="text-xl font-bold text-gold-dark">{title}</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleScrollToTop}
            className="p-2 w-10 h-10 flex items-center justify-center rounded-full bg-beige-300 focus:outline-none focus:ring-0 active:outline-none"
            aria-label="Scroll to top"
          >
            {'▲'}
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-600 italic truncate" title={currentVerse}>
        {currentVerse}
      </p>
    </header>
  );
};

export default Header;
