import { useEffect, useRef, useState } from "react";

export interface CustomSelectOption<T extends string = string> {
  value: T;
  label: string;
  badge?: string | number;
}

interface CustomSelectProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: CustomSelectOption<T>[];
  ariaLabel?: string;
  className?: string;
  variant?: "default" | "attached";
}

export function CustomSelect<T extends string = string>({
  value,
  onChange,
  options,
  ariaLabel,
  className = "",
  variant = "default",
}: CustomSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) ?? options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left select-none ${className}`}
    >
      <button
        type="button"
        aria-label={ariaLabel ?? selectedOption?.label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={
          variant === "attached"
            ? "flex items-center gap-1.5 bg-transparent text-[11.5px] font-bold text-[#5A6067] hover:text-[#263847] py-1.5 px-2.5 border-r border-[#E6E1D2] outline-none cursor-pointer transition-colors"
            : "flex items-center gap-1.5 bg-[#FAF9F5] hover:bg-[#F5F3E9] text-[11.5px] font-bold text-[#5A6067] hover:text-[#263847] py-1.5 px-3 rounded-lg border border-[#E6E1D2] outline-none cursor-pointer transition-all shadow-xs"
        }
      >
        <span>{selectedOption?.label}</span>
        <svg
          className={`w-3.5 h-3.5 text-[#93927F] transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[#354B5E]" : ""
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 mt-1.5 min-w-[150px] w-max bg-[#FCFBF7] rounded-xl border border-[#E6E1D2] shadow-xl p-1 z-50 animate-in fade-in zoom-in-95 duration-150 origin-top-left"
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                role="option"
                aria-selected={isSelected}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-colors cursor-pointer text-left ${
                  isSelected
                    ? "bg-[#E9EDF0] text-[#354B5E]"
                    : "text-[#5A6067] hover:bg-[#F5F3E9] hover:text-[#263847]"
                }`}
              >
                <span>{option.label}</span>
                {isSelected && (
                  <svg
                    className="w-3.5 h-3.5 text-[#354B5E] flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
