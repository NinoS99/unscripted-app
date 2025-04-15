"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const SearchBar = () => {
  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      router.push(`/search?query=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setShowSearch(!showSearch)}>
        <Image src="/search.png" alt="Search" width={20} height={20} className="mt-2 ml-4 cursor-pointer" />
      </button>
      {showSearch && (
        <input
          type="text"
          placeholder="Search shows"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearch}
          className="absolute right-0 top-10 bg-white border border-green-300 text-black rounded px-2 py-1 text-sm shadow-md"
        />
      )}
    </div>
  );
};

export default SearchBar;
