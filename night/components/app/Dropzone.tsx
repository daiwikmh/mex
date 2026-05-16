"use client";

import { useRef, useState } from "react";

export function Dropzone({
  onFile,
  disabled,
}: {
  onFile: (f: File) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (disabled) return;
    setHover(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFile(f);
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setHover(true);
      }}
      onDragLeave={() => setHover(false)}
      onDrop={handleDrop}
      className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-surface p-12 text-center transition-colors ${
        hover
          ? "border-accent-strong bg-surface-2"
          : "border-border hover:border-white/20"
      } ${disabled ? "pointer-events-none opacity-60" : ""}`}
    >
      <div className="font-mono text-xs uppercase tracking-widest text-foreground/40">
        Step 1
      </div>
      <div className="text-2xl font-semibold tracking-tight">
        Drop your Plaid CSV.
      </div>
      <p className="max-w-md text-sm text-foreground/65">
        Twelve months of statements is enough. The file is encrypted in your
        browser before anything else happens. No upload of plaintext, ever.
      </p>
      <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-border bg-surface-2 px-3 py-1 font-mono text-xs text-foreground/65">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        AES-GCM · wallet-derived key · IndexedDB only
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="mt-2 rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background hover:bg-foreground/90"
      >
        Choose file
      </button>
    </label>
  );
}
