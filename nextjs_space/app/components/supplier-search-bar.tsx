"use client";

import { useState } from "react";
import { Search } from "lucide-react";

interface SupplierSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function SupplierSearchBar({ onSearch, placeholder = "Search..." }: SupplierSearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    // Optional: trigger search on every keystroke with debouncing
    // For now, search on form submit
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        className="pl-10 pr-4 py-2 border rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
      />
    </form>
  );
}
