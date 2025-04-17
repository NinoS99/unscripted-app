// SearchBar.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { FiX } from "react-icons/fi";

const SearchBar = ({ onSearchToggle }: { onSearchToggle?: (isOpen: boolean) => void }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search?query=${encodeURIComponent(query.trim())}`);
      // Close search bar in mobile view after search
      if (window.innerWidth < 768) {
        setShowSearch(false);
        onSearchToggle?.(false);
      } else {
        onSearchToggle?.(true); // Keep open in desktop
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
          inputRef.current.selectionStart = inputRef.current.value.length;
          inputRef.current.selectionEnd = inputRef.current.value.length;
        }
      }, 0);
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSearch, onSearchToggle]);

  return (
    <div className="search-container relative h-10">
      {/* Fixed Position Wrapper */}
      <div className="relative h-full flex items-center">
        {/* Desktop View */}
        <div className="hidden md:flex items-center h-full">
          {/* Search Bar */}
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
                  onClick={toggleSearch}
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
          
          {/* Search Button - Handles both toggle and search */}
          <button
            onClick={() => showSearch ? handleSearch() : toggleSearch()}
            className="h-10 w-10 flex items-center justify-center hover:bg-green-100 rounded-full transition-colors duration-200 cursor-pointer"
          >
            <Image
              src="/search.png"
              alt={showSearch ? "Submit Search" : "Open Search"}
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </button>
        </div>

        {/* Mobile View */}
        <div className="md:hidden h-full">
          <button
            onClick={toggleSearch}
            className="h-10 w-10 flex items-center justify-center hover:bg-green-100 rounded-full transition-colors duration-200 cursor-pointer"
          >
            <Image
              src="/search.png"
              alt="Search"
              width={24}
              height={24}
              className="w-6 h-6"
            />
          </button>

          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="fixed top-16 left-0 right-0 bg-white z-50 px-4 py-2 shadow-md"
              >
                <div className="flex items-center h-10 bg-white rounded-lg border border-gray-300 w-full">
                  <button
                    onClick={toggleSearch}
                    className="h-full flex items-center px-1 shrink-0"
                  >
                    <FiX className="w-5 h-5 text-gray-600" />
                  </button>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="search shows"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="bg-transparent border-none text-black focus:outline-none w-full h-full text-base placeholder-gray-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSearch}
                    className="h-full w-10 flex items-center justify-center"
                  >
                    <Image
                      src="/search.png"
                      alt="Search"
                      width={20}
                      height={20}
                      className="w-6 h-6"
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