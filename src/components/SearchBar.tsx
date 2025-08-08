// SearchBar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiSearch } from "react-icons/fi";
import { FaMagnifyingGlass } from "react-icons/fa6";

const SearchBar = ({
    onSearchToggle,
}: {
    onSearchToggle?: (isOpen: boolean) => void;
}) => {
    const [showSearch, setShowSearch] = useState(false);
    const [query, setQuery] = useState("");
    const router = useRouter();
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSearch = () => {
        if (query.trim()) {
            router.push(`/search?query=${encodeURIComponent(query.trim())}`);
            if (window.innerWidth < 768) {
                setShowSearch(false);
                onSearchToggle?.(false);
            } else {
                onSearchToggle?.(true);
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            handleSearch();
        }
    };

    const toggleSearch = () => {
        const newState = !showSearch;
        setShowSearch(newState);
        onSearchToggle?.(newState);
        if (newState && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
                if (inputRef.current) {
                    inputRef.current.selectionStart =
                        inputRef.current.value.length;
                    inputRef.current.selectionEnd =
                        inputRef.current.value.length;
                }
            }, 0);
        }
    };

    // New function to handle X button click
    const handleCloseClick = () => {
        if (window.innerWidth < 768) {
            // Mobile - clear the search input
            setQuery("");
            inputRef.current?.focus();
        } else {
            // Desktop - close the search bar
            toggleSearch();
        }
    };

    useEffect(() => {
        if (!showSearch) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target as Element).closest(".search-container")) {
                setShowSearch(false);
                onSearchToggle?.(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, [showSearch, onSearchToggle]);

    return (
        <div className="search-container relative h-10">
            <div className="relative h-full flex items-center">
                {/* Desktop View */}
                <div className="hidden md:flex items-center h-full">
                    <AnimatePresence>
                        {showSearch && (
                            <motion.div
                                key="search-bar"
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 200 }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex items-center h-full bg-white rounded-lg border border-gray-300 overflow-hidden mr-2"
                            >
                                <button
                                    onClick={toggleSearch} // Desktop still closes on X click
                                    className="h-full flex items-center px-2 shrink-0"
                                >
                                    <FiX className="w-5 h-5 text-gray-600" />
                                </button>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search shows"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="bg-transparent border-none text-black focus:outline-none w-full h-full text-base placeholder-gray-500 px-2"
                                    autoFocus
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() =>
                            showSearch ? handleSearch() : toggleSearch()
                        }
                        className="h-10 w-10 flex items-center justify-center hover:bg-green-100 rounded-full transition-colors duration-200 cursor-pointer"
                    >
                        <FaMagnifyingGlass
                            className={`w-6 h-6 text-white`}
                            title={showSearch ? "Submit Search" : "Open Search"}
                        />
                    </button>
                </div>

                {/* Mobile View */}
                <div className="md:hidden h-full">
                    <button
                        onClick={toggleSearch}
                        className="h-10 w-10 flex items-center justify-center hover:bg-green-100 rounded-full transition-colors duration-200 cursor-pointer"
                    >
                        <FiSearch
                            className={`w-5 h-5 text-white`}
                            title={showSearch ? "Submit Search" : "Open Search"}
                        />
                    </button>

                    <AnimatePresence>
                        {showSearch && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2 }}
                                className="fixed top-16 left-0 right-0 bg-gray-900 z-50 px-4 py-2 shadow-md"
                            >
                                <div className="flex items-center h-10 bg-white rounded-lg border border-gray-300 w-full">
                                    <button
                                        onClick={handleCloseClick} // Use the new handler for mobile
                                        className="h-full flex items-center px-1 shrink-0"
                                    >
                                        <FiX className="w-5 h-5 text-gray-600" />
                                    </button>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        placeholder="search shows"
                                        value={query}
                                        onChange={(e) =>
                                            setQuery(e.target.value)
                                        }
                                        onKeyDown={handleKeyDown}
                                        className="bg-transparent border-none text-black focus:outline-none w-full h-full text-base placeholder-gray-500"
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleSearch}
                                        className="h-full w-10 flex items-center justify-center"
                                    >
                                        <FiSearch
                                            className={`w-5 h-5 text-gray-400`}
                                            title={
                                                showSearch
                                                    ? "Submit Search"
                                                    : "Open Search"
                                            }
                                        />
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default SearchBar;
