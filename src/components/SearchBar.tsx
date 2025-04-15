"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const SearchBar = ({ onSearchToggle }: { onSearchToggle?: (isOpen: boolean) => void }) => {
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = () => {
    if (query.trim()) {
      router.push(`/search?query=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setShowSearch(false);
      onSearchToggle?.(false);
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
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <div className="flex items-center">
      {showSearch ? (
        <div className="flex items-center h-8 bg-white rounded-md px-2 border border-gray-300">
          <button 
            onClick={toggleSearch} 
            className="h-full flex items-center mr-2"
          >
            <Image 
              src="/close.png" 
              alt="Cancel" 
              width={16} 
              height={16} 
              className="cursor-pointer"
            />
          </button>
          <input
            ref={inputRef}
            type="text"
            placeholder="search shows"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-transparent border-none text-black focus:outline-none w-28 h-full text-sm placeholder-gray-500"
          />
          <button 
            onClick={handleSearch} 
            className="h-full flex items-center ml-2"
          >
            <Image 
              src="/search.png" 
              alt="Search" 
              width={16} 
              height={16} 
              className="cursor-pointer"
            />
          </button>
        </div>
      ) : (
        <button 
          onClick={toggleSearch} 
          className="h-8 flex items-center justify-center px-2"
        >
          <Image 
            src="/search.png" 
            alt="Search" 
            width={16} 
            height={16} 
            className="cursor-pointer"
          />
        </button>
      )}
    </div>
  );
};

export default SearchBar;