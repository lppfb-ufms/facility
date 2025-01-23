import type { ComponentProps, ReactNode } from "react";

export function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="rounded-full bg-gradient-to-r from-cyan-600 to-cyan-500 px-6 py-2 text-lg font-bold text-white"
    >
      {children}
    </button>
  );
}

export function TextInput({
  label,
  ...props
}: {
  label?: string;
} & ComponentProps<"input">) {
  if (!label)
    return (
      <input
        className="mt-1 w-full rounded-2xl border bg-neutral-50 px-2 py-3 text-base text-black disabled:bg-neutral-200"
        {...props}
      />
    );

  return (
    <label
      className="flex flex-col text-lg text-cyan-600 aria-disabled:text-neutral-700"
      aria-disabled={props.disabled}
      htmlFor={props.id}
    >
      {label}
      <input
        className="mt-1 rounded-2xl border bg-neutral-50 px-2 py-3 text-base text-black disabled:bg-neutral-200"
        {...props}
      />
    </label>
  );
}

export function TextAreaInput({
  label,
  ...props
}: {
  label: string;
} & ComponentProps<"textarea">) {
  return (
    <label className="flex flex-col text-lg text-cyan-600" htmlFor={props.id}>
      {label}
      <textarea
        className="mt-1 resize-none overflow-auto rounded-2xl border bg-neutral-50 px-2 py-3 text-base text-black"
        {...props}
      />
    </label>
  );
}

export function CheckboxInput({
  label,
  ...props
}: {
  label: string;
} & ComponentProps<"input">) {
  return (
    <label className="flex gap-2 text-lg text-cyan-600" htmlFor={props.id}>
      <input type="checkbox" {...props} />
      {label}
    </label>
  );
}

export function SelectInput({
  label,
  options,
  ...props
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
} & ComponentProps<"select">) {
  return (
    <label className="flex flex-col text-lg text-cyan-600" htmlFor={props.id}>
      {label}
      <select
        className="mt-1 rounded-2xl border bg-neutral-50 px-2 py-3 text-base text-black"
        {...props}
      >
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FormErrorMessage({ errors }: { errors?: Array<string> }) {
  if (!errors || errors.length === 0) return null;
  return (
    <ul className="flex list-inside list-disc flex-col gap-1 rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-800">
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}
