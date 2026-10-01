"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export type SelectOption = { value: string; label: string };
export default function CustomSelect({
  id,
  label,
  value,
  options,
  onChange,
}: {
  id?: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}) {
  const generated = useId(),
    controlId = id ?? generated,
    listId = `${controlId}-options`;
  const [open, setOpen] = useState(false),
    [active, setActive] = useState(0);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: 260,
  });
  const [portal, setPortal] = useState<Element | null>(null);
  const trigger = useRef<HTMLButtonElement>(null),
    panel = useRef<HTMLDivElement>(null);
  const search = useRef({ text: "", time: 0 });
  const selected = options.findIndex((option) => option.value === value);
  function expand() {
    setActive(Math.max(0, selected));
    setPortal(trigger.current?.closest("dialog") ?? document.body);
    setOpen(true);
  }
  function choose(index: number) {
    onChange(options[index].value);
    setOpen(false);
    trigger.current?.focus();
  }
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom - 16,
        above = rect.top - 16;
      const upwards = below < 160 && above > below;
      const maxHeight = Math.max(80, Math.min(280, upwards ? above : below));
      const height = Math.min(maxHeight, options.length * 44 + 12);
      setPosition({
        top: upwards ? rect.top - height - 7 : rect.bottom + 7,
        left: Math.min(rect.left, window.innerWidth - rect.width - 12),
        width: rect.width,
        maxHeight,
      });
    };
    place();
    const outside = (event: PointerEvent) => {
      if (
        !trigger.current?.contains(event.target as Node) &&
        !panel.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    const scroll = (event: Event) => {
      if (!panel.current?.contains(event.target as Node)) place();
    };
    document.addEventListener("pointerdown", outside);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", scroll, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", scroll, true);
    };
  }, [open, options.length]);
  useEffect(() => {
    if (open)
      panel.current
        ?.querySelector(`[data-index="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);
  return (
    <div className="custom-select">
      <button
        ref={trigger}
        id={controlId}
        type="button"
        className="custom-select-trigger"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : expand())}
        onKeyDown={(event) => {
          if (event.key === "Escape" && open) {
            event.preventDefault();
            event.stopPropagation();
            setOpen(false);
            return;
          }
          if (event.key === "Tab") {
            setOpen(false);
            return;
          }
          if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
            event.preventDefault();
            if (!open) {
              expand();
              return;
            }
            setActive((index) =>
              event.key === "Home"
                ? 0
                : event.key === "End"
                  ? options.length - 1
                  : (index +
                      (event.key === "ArrowDown" ? 1 : options.length - 1)) %
                    options.length,
            );
            return;
          }
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (open) choose(active);
            else expand();
            return;
          }
          if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
            const now = Date.now();
            search.current.text =
              (now - search.current.time > 700 ? "" : search.current.text) +
              event.key.toLocaleLowerCase("ro");
            search.current.time = now;
            const index = options.findIndex((option) =>
              option.label
                .toLocaleLowerCase("ro")
                .startsWith(search.current.text),
            );
            if (index >= 0) {
              if (!open) expand();
              setActive(index);
            }
          }
        }}
      >
        <span>{options[selected]?.label ?? options[0]?.label}</span>
        <ChevronDown size={16} className={open ? "select-chevron-open" : ""} />
      </button>
      {open &&
        portal &&
        createPortal(
          <div
            ref={panel}
            id={listId}
            role="listbox"
            aria-label={label}
            className="custom-select-panel"
            style={position}
          >
            {options.map((option, index) => (
              <div
                id={`${listId}-${index}`}
                key={option.value}
                role="option"
                aria-selected={value === option.value}
                data-index={index}
                className={`custom-select-option ${index === active ? "active" : ""}`}
                onPointerMove={() => setActive(index)}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(index)}
              >
                <span>{option.label}</span>
                {value === option.value && <Check size={15} />}
              </div>
            ))}
          </div>,
          portal,
        )}
    </div>
  );
}
