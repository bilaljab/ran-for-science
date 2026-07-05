"use client";

import { useTransition } from "react";
import { Select } from "@/components/ui/Select";

export function StatusSelect({
  id,
  status,
  options,
  onChange,
}: {
  id: string;
  status: string;
  options: { value: string; label: string }[];
  onChange: (id: string, status: string) => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Select
      defaultValue={status}
      disabled={pending}
      className="w-auto"
      onChange={(e) => {
        const next = e.target.value;
        startTransition(() => {
          onChange(id, next);
        });
      }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </Select>
  );
}
