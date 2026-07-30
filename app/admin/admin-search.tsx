"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && value.trim()) {
      router.push(`/admin/clients?q=${encodeURIComponent(value.trim())}`);
    }
  }

  return (
    <input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder="Search clients… (press Enter)"
      className="input max-w-xs"
    />
  );
}
