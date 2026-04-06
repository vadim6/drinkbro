"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Menu, DrinkDef, CustomizationDef } from "@/lib/menu";
import { DrinkIcon } from "@/components/DrinkIcon";

type CustomizationValues = Record<string, boolean | string>;

function buildCustomizationDefaults(
  drink: DrinkDef,
  menu: Menu
): CustomizationValues {
  const result: CustomizationValues = {};
  for (const id of drink.customizations) {
    const def = menu.customizations[id];
    if (def) result[id] = def.default;
  }
  return result;
}

function describeCustomizations(
  values: CustomizationValues,
  drink: DrinkDef,
  menu: Menu
): string[] {
  const parts: string[] = [];
  for (const id of drink.customizations) {
    const def = menu.customizations[id];
    if (!def) continue;
    const val = values[id];
    if (def.type === "toggle" && val === true) {
      parts.push(def.label);
    } else if (def.type === "select" && val !== def.default) {
      parts.push(String(val));
    }
  }
  return parts;
}

export default function DrinkPage({ slug }: { slug: string }) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<DrinkDef | null>(null);
  const [customValues, setCustomValues] = useState<CustomizationValues>({});
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetExiting, setSheetExiting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [nameHint, setNameHint] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historySheetActive = useRef(false);

  useEffect(() => {
    fetch("/api/menu")
      .then((r) => r.json())
      .then(setMenu);
    const saved = localStorage.getItem("drinkbro_name");
    if (saved) setName(saved);
  }, []);

  useEffect(() => {
    function onPopstate() {
      if (!historySheetActive.current) return;
      historySheetActive.current = false;
      setSheetExiting(true);
      setTimeout(() => {
        setSheetVisible(false);
        setSheetExiting(false);
        setSelected(null);
      }, 240);
    }
    window.addEventListener("popstate", onPopstate);
    return () => window.removeEventListener("popstate", onPopstate);
  }, []);

  useEffect(() => {
    if (name) localStorage.setItem("drinkbro_name", name);
  }, [name]);

  function openDrink(drink: DrinkDef) {
    if (!menu) return;
    if (!name.trim()) {
      const el = nameRef.current;
      if (el) {
        el.focus();
        el.style.animation = "none";
        void el.offsetWidth;
        el.style.animation = "shake 0.35s cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards";
      }
      setNameHint(true);
      return;
    }
    setNameHint(false);
    setSelected(drink);
    setCustomValues(buildCustomizationDefaults(drink, menu));
    setSheetVisible(true);
    setSheetExiting(false);
    history.pushState(null, "");
    historySheetActive.current = true;
  }

  function closeSheet() {
    if (historySheetActive.current) {
      historySheetActive.current = false;
      history.back();
    }
    setSheetExiting(true);
    setTimeout(() => {
      setSheetVisible(false);
      setSheetExiting(false);
      setSelected(null);
    }, 240);
  }

  function showToast(msg: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2800);
  }

  async function submitOrder() {
    if (!selected || !menu) return;
    const trimmedName = name.trim();
    setSubmitting(true);
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: trimmedName,
          drink_id: selected.id,
          drink_name: selected.name,
          customizations: customValues,
        }),
      });
      closeSheet();
      showToast(`${selected.emoji.startsWith("/") ? "" : selected.emoji + " "}${selected.name} is on its way!`);
    } finally {
      setSubmitting(false);
    }
  }

  if (!menu) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-brew">
        <span className="text-4xl animate-pulse">☕</span>
      </div>
    );
  }

  const drinkCustomizations = selected
    ? selected.customizations
        .map((id) => {
          const def = menu.customizations[id];
          return def ? { id, ...def } : null;
        })
        .filter(Boolean) as Array<{ id: string } & CustomizationDef>
    : [];

  return (
    <div className="flex-1 flex flex-col bg-brew pt-safe">
      {/* Header */}
      <header className="px-5 pt-5 pb-3 flex items-center justify-between">
        <Link href={slug ? `/drink/${slug}` : "/drink"} className="flex items-center gap-2">
          <img src="/logo.svg" alt="" className="w-9 h-9" />
          <div>
            <h1
              className="text-3xl text-bark"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              DrinkBro
            </h1>
            <p className="text-sm text-muted mt-0.5">What can I get you?</p>
          </div>
        </Link>
        <Link href={slug ? `/barista/${slug}` : "/barista"}>
          <img src="/barista.png" alt="Barista" className="w-12 h-12 opacity-40 hover:opacity-70 transition-opacity" />
        </Link>
      </header>

      {/* Name input */}
      <div className="px-5 pb-4">
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => { setName(e.target.value); setNameHint(false); }}
            onAnimationEnd={() => { if (nameRef.current) nameRef.current.style.animation = ""; }}
            enterKeyHint="done"
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            autoCapitalize="words"
            placeholder="Your name..."
            className={`w-full rounded-2xl bg-card px-4 py-3.5 text-bark placeholder-muted border focus:outline-none focus:ring-2 focus:ring-amber text-base shadow-sm transition-colors ${nameHint ? "border-amber" : "border-tan"}`}
          />
        {nameHint && (
          <p className="text-xs text-amber mt-1.5 px-1">Enter your name to order</p>
        )}
      </div>

      {/* Drink grid */}
      <div className="flex-1 px-4 pb-6 grid grid-cols-2 gap-3 content-start">
        {menu.drinks.map((drink) => (
          <button
            key={drink.id}
            onClick={() => openDrink(drink)}
            className="flex flex-col items-center justify-center gap-2 bg-card rounded-3xl shadow-sm py-7 px-4 active:scale-95 transition-transform duration-100 border border-tan/40"
          >
            <DrinkIcon icon={drink.emoji} emojiClassName="text-5xl leading-none" imgClassName="h-14 w-auto" />
            <span className="text-sm font-semibold text-bark tracking-wide">
              {drink.name}
            </span>
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 toast-enter z-50 pointer-events-none">
          <div className="bg-bark text-brew text-sm font-medium px-5 py-3 rounded-2xl shadow-lg whitespace-nowrap">
            {toast}
          </div>
        </div>
      )}

      {/* Bottom sheet */}
      {sheetVisible && selected && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={closeSheet}
          />

          {/* Sheet */}
          <div
            className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-brew rounded-t-3xl shadow-2xl pb-safe
              ${sheetExiting ? "sheet-exit" : "sheet-enter"}`}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-tan" />
            </div>

            <div className="px-5 pt-3 pb-4">
              {/* Title */}
              <div className="flex items-center gap-3 mb-5">
                <DrinkIcon icon={selected.emoji} emojiClassName="text-4xl" imgClassName="h-12 w-auto" />
                <h2
                  className="text-2xl text-bark"
                  style={{ fontFamily: "var(--font-lora)" }}
                >
                  {selected.name}
                </h2>
              </div>

              {/* Customizations */}
              {drinkCustomizations.length > 0 && (
                <div className="flex flex-col gap-4 mb-6">
                  {drinkCustomizations.map((cust) => (
                    <div key={cust.id}>
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted mb-2">
                        {cust.label}
                      </p>
                      {cust.type === "toggle" ? (
                        <div className="flex gap-2">
                          {["Yes", "No"].map((opt) => {
                            const active =
                              opt === "Yes"
                                ? customValues[cust.id] === true
                                : customValues[cust.id] === false;
                            return (
                              <button
                                key={opt}
                                onClick={() =>
                                  setCustomValues((v) => ({
                                    ...v,
                                    [cust.id]: opt === "Yes",
                                  }))
                                }
                                className={`flex-1 py-3 rounded-2xl text-sm font-medium transition-colors border
                                  ${
                                    active
                                      ? "bg-amber border-amber text-white"
                                      : "bg-card border-tan text-bark"
                                  }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
                          {cust.options!.map((opt) => {
                            const active = customValues[cust.id] === opt;
                            return (
                              <button
                                key={opt}
                                onClick={() =>
                                  setCustomValues((v) => ({
                                    ...v,
                                    [cust.id]: opt,
                                  }))
                                }
                                className={`flex-shrink-0 px-4 py-3 rounded-2xl text-sm font-medium transition-colors border
                                  ${
                                    active
                                      ? "bg-amber border-amber text-white"
                                      : "bg-card border-tan text-bark"
                                  }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Preview */}
              {drinkCustomizations.length > 0 && (
                <p className="text-sm text-muted mb-5 min-h-[1.25rem]">
                  {(() => {
                    const parts = describeCustomizations(
                      customValues,
                      selected,
                      menu
                    );
                    return parts.length > 0 ? parts.join(" · ") : " ";
                  })()}
                </p>
              )}

              {/* Order button */}
              <button
                onClick={submitOrder}
                disabled={submitting}
                className="w-full bg-amber text-white rounded-2xl py-4 text-base font-semibold tracking-wide shadow-sm active:opacity-90 transition-opacity disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Order"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
