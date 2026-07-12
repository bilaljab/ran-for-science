"use client";

import { useState, useTransition } from "react";
import { Select } from "@/components/ui/Select";
import { ErrorToast } from "@/components/ui/ErrorToast";

export function StatusSelect({
  id,
  status,
  options,
  onChange,
}: {
  id: string;
  status: string;
  options: { value: string; label: string }[];
  onChange: (id: string, status: string) => Promise<boolean>;
}) {
  const [pending, startTransition] = useTransition();
  const [resetKey, setResetKey] = useState(0);
  const [errorKey, setErrorKey] = useState(0);

  return (
    <>
      <Select
        key={resetKey}
        defaultValue={status}
        disabled={pending}
        className="w-auto"
        onChange={(e) => {
          const next = e.target.value;
          startTransition(async () => {
            try {
              const ok = await onChange(id, next);
              if (!ok) {
                setResetKey((k) => k + 1);
                setErrorKey((k) => k + 1);
              }
            } catch {
              setResetKey((k) => k + 1);
              setErrorKey((k) => k + 1);
            }
          });
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
      <ErrorToast triggerKey={errorKey} message="تعذّر تحديث الحالة، حاول مرة أخرى" />
    </>
  );
}
