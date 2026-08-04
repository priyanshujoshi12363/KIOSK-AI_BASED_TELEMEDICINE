import { useState } from "react";

export default function TagInput({ value = [], onChange, placeholder }) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (v && !value.includes(v)) {
      onChange([...value, v]);
    }
    setDraft("");
  }

  function remove(tag) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div className="rounded-lg border border-zinc-300 bg-white p-2 focus-within:border-saffron focus-within:ring-2 focus-within:ring-saffron/25">
      <div className="flex flex-wrap gap-2">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
          >
            {tag}
            <button
              type="button"
              onClick={() => remove(tag)}
              className="text-zinc-400 hover:text-red-500"
            >
              ×
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
          onBlur={add}
          placeholder={placeholder}
          className="min-w-32 flex-1 bg-transparent px-1 py-1 text-sm text-zinc-900 placeholder-zinc-400 outline-none"
        />
      </div>
    </div>
  );
}
