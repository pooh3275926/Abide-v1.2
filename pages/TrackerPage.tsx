
import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { BibleBook } from '../types';
import { BIBLE_BOOKS } from '../constants/constants';

const BookItem: React.FC<{
    book: BibleBook;
    completedChapters: Set<number>;
    onToggleChapter: (bookName: string, chapter: number) => void;
}> = ({ book, completedChapters, onToggleChapter }) => {
    const [isOpen, setIsOpen] = useState(false);
    const totalCompleted = Array.from({ length: book.chapters }, (_, i) => completedChapters.has(i + 1)).filter(Boolean).length;
    const progress = book.chapters > 0 ? (totalCompleted / book.chapters) * 100 : 0;

    return (
        <div className="mb-2 bg-beige-50 rounded-lg shadow-sm transition-all">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-4 text-left">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg">{book.name}</h3>
                    <span className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                    <div className="flex-grow bg-gold-light rounded-full h-2.5">
                        <div className="bg-gold-dark h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p className="flex-shrink-0 text-sm text-gray-500 tabular-nums">
                        {totalCompleted} / {book.chapters} ({Math.round(progress)}%)
                    </p>
                </div>
            </button>
            {isOpen && (
                <div className="p-4 border-t border-beige-200 grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chapter => {
                        const isCompleted = completedChapters.has(chapter);
                        return (
                            <button
                                key={chapter}
                                onClick={() => onToggleChapter(book.name, chapter)}
                                className={`flex items-center justify-center font-mono text-sm p-2 rounded-md transition-colors aspect-square ${
                                    isCompleted 
                                    ? 'bg-gold-dark text-white font-bold' 
                                    : 'bg-beige-100 hover:bg-beige-200'
                                }`}
                                aria-label={`第 ${chapter} 章, 狀態: ${isCompleted ? '已完成' : '未完成'}`}
                            >
                                {chapter}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

type BibleTrackerProgress = Record<string, Record<number, boolean>>;

const TrackerPage: React.FC = () => {
    const [progress, setProgress] = useLocalStorage<BibleTrackerProgress>('bibleTrackerProgress', {});

    const handleToggleChapter = (bookName: string, chapter: number) => {
        setProgress(prevProgress => {
            const newProgress = { ...prevProgress };
            const bookProgress = { ...(newProgress[bookName] || {}) };
    
            if (bookProgress[chapter]) {
                delete bookProgress[chapter];
            } else {
                bookProgress[chapter] = true;
            }
    
            if (Object.keys(bookProgress).length === 0) {
                delete newProgress[bookName];
            } else {
                newProgress[bookName] = bookProgress;
            }
            
            return newProgress;
        });
    };

    const completionStatus = useMemo(() => {
        const status = new Map<string, Set<number>>();
        for (const bookName in progress) {
            const chapterSet = new Set<number>();
            for (const chapter in progress[bookName]) {
                if (progress[bookName][chapter]) {
                    chapterSet.add(Number(chapter));
                }
            }
            status.set(bookName, chapterSet);
        }
        return status;
    }, [progress]);

    const { totalCompletedChapters, totalBibleChapters, totalProgressPercentage } = useMemo(() => {
        const totalChapters = BIBLE_BOOKS.reduce((sum, book) => sum + book.chapters, 0);
        let completedChapters = 0;
        for (const bookName in progress) {
            completedChapters += Object.keys(progress[bookName]).length;
        }
        const percentage = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

        return {
            totalCompletedChapters: completedChapters,
            totalBibleChapters: totalChapters,
            totalProgressPercentage: percentage,
        };
    }, [progress]);


    const oldTestamentBooks = BIBLE_BOOKS.filter(b => b.testament === 'Old');
    const newTestamentBooks = BIBLE_BOOKS.filter(b => b.testament === 'New');

    return (
        <div className="container mx-auto">
            <div className="mt-8 mb-2 p-4 bg-beige-50 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-3 text-center text-gold-dark">總進度</h2>
                <div className="mt-2 flex items-center gap-3">
                    <div className="flex-grow bg-gold-light rounded-full h-4">
                        <div className="bg-gold-dark h-4 rounded-full transition-all duration-500" style={{ width: `${totalProgressPercentage}%` }}></div>
                    </div>
                    <p className="flex-shrink-0 text-md text-gray-600 tabular-nums font-semibold">
                        {totalCompletedChapters} / {totalBibleChapters} ({Math.round(totalProgressPercentage)}%)
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h2 className="mt-4 text-xl font-semibold mb-3 text-center">舊約</h2>
                    {oldTestamentBooks.map(book => (
                        <BookItem key={book.name} book={book} completedChapters={completionStatus.get(book.name) || new Set()} onToggleChapter={handleToggleChapter} />
                    ))}
                </div>
                 <div>
                    <h2 className="mt-4 text-xl font-semibold mb-3 text-center">新約</h2>
                    {newTestamentBooks.map(book => (
                        <BookItem key={book.name} book={book} completedChapters={completionStatus.get(book.name) || new Set()} onToggleChapter={handleToggleChapter} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default TrackerPage;