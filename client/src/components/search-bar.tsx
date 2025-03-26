import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="relative">
        <Input
          type="text"
          placeholder="Search for products..."
          className="w-full pl-10 pr-4 py-2"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <div className="absolute left-3 top-2.5 text-gray-400">
          <Search className="h-4 w-4" />
        </div>
      </div>
    </form>
  );
}
