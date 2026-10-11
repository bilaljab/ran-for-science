"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { OTHER_OPTION } from "@/features/workshops/constants/options";

interface ChoiceProps {
  name: string;
  label: string;
  options: readonly string[];
  error?: string;
  otherError?: string;
}

// Dropdown; picking "أخرى" reveals a text box submitted as `${name}Other`.
export function SelectWithOther({ name, label, options, error, otherError }: ChoiceProps) {
  const [value, setValue] = useState("");

  return (
    <div className="flex flex-col gap-3">
      <FormField label={label} htmlFor={name} required error={error}>
        <Select id={name} name={name} required value={value} onChange={(e) => setValue(e.target.value)} invalid={!!error} aria-invalid={!!error}>
          <option value="" disabled>
            اختر
          </option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </FormField>
      {value === OTHER_OPTION && (
        <FormField label="حدّد" htmlFor={`${name}Other`} required error={otherError}>
          <Input id={`${name}Other`} name={`${name}Other`} required maxLength={80} invalid={!!otherError} aria-invalid={!!otherError} />
        </FormField>
      )}
    </div>
  );
}

// Radio chips; picking "أخرى" (when offered) reveals a text box submitted as `${name}Other`.
export function RadioChoice({ name, label, options, error, otherError }: ChoiceProps) {
  const [value, setValue] = useState("");

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-sm font-medium text-primary-700">
        {label}
        <span className="ms-1 text-mauve-600">*</span>
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label
            key={option}
            className={cn(
              "cursor-pointer rounded-md border px-4 py-2 text-base transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary-400",
              value === option ? "border-primary-500 bg-primary-50 text-primary-700" : "border-primary-200 bg-white text-foreground"
            )}
          >
            <input
              type="radio"
              name={name}
              value={option}
              required
              checked={value === option}
              onChange={() => setValue(option)}
              className="sr-only"
            />
            {option}
          </label>
        ))}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {value === OTHER_OPTION && (
        <FormField label="حدّد" htmlFor={`${name}Other`} required error={otherError}>
          <Input id={`${name}Other`} name={`${name}Other`} required maxLength={120} invalid={!!otherError} aria-invalid={!!otherError} />
        </FormField>
      )}
    </fieldset>
  );
}
