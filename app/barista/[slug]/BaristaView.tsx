"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Menu } from "@/lib/menu";

interface Order {
  id: number;
  guest_name: string;
  drink_id: string;
  drink_name: string;
  customizations: string;
  status: "pending" | "done";
  created_at: string;
}

function getEmoji(menu: Menu | null, drinkId: string): string {
  if (!menu) return "☕";
  return menu.drinks.find((d) => d.id === drinkId)?.emoji ?? "☕";
}

function describeCustomizations(
  raw: string,
  menu: Menu | null,
  drinkId: string
): string[] {
  if (!menu) return [];
  const drink = menu.drinks.find((d) => d.id === drinkId);
  if (!drink) return [];

  let vals: Record<string, boolean | string>;
  try {
    vals = JSON.parse(raw);
  } catch {
    return [];
  }

  const parts: string[] = [];
  for (const id of drink.customizations) {
    const def = menu.customizations[id];
    if (!def) continue;
    const val = vals[id];
    if (def.type === "toggle" && val === true) {
      parts.push(def.label);
    } else if (def.type === "select" && val && val !== def.default) {
      parts.push(String(val));
    }
  }
  return parts;
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr + "Z").getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

export default function AdminPage({ slug }: { slug: string }) {
  const [menu, setMenu] = useState<Menu | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmRevert, setConfirmRevert] = useState<number | null>(null);
  const [, tick] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetch("/api/menu").then((r) => r.json()).then(setMenu);
    fetch("/api/orders").then((r) => r.json()).then(setOrders);

    const es = new EventSource("/api/orders/stream");
    esRef.current = es;

    es.onmessage = (e) => {
      const event = JSON.parse(e.data);
      if (event.type === "snapshot") setOrders(event.orders);
    };

    return () => es.close();
  }, []);

  // Tick every 30s to refresh time-ago labels
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  async function markDone(id: number) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "done" } : o))
    );
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
  }

  async function markPending(id: number) {
    setConfirmRevert(null);
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "pending" } : o))
    );
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "pending" }),
    });
  }

  async function resetOrders() {
    setConfirmReset(false);
    await fetch("/api/orders", { method: "DELETE" });
    setOrders([]);
  }

  const pending = orders.filter((o) => o.status === "pending");
  const done = orders.filter((o) => o.status === "done");

  return (
    <div className="flex-1 flex flex-col bg-brew pt-safe">
      {/* Header */}
      <header className="px-5 pt-5 pb-4 flex items-center justify-between">
        <Link href={slug ? `/drink/${slug}` : "/drink"} className="flex items-center gap-2">
          <img src="/logo.svg" alt="" className="w-9 h-9" />
          <div>
            <h1
              className="text-3xl text-bark"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              DrinkBro
            </h1>
            <p className="text-sm text-muted mt-0.5">
              Barista view{pending.length > 0 ? ` · ${pending.length} pending ${pending.length === 1 ? "order" : "orders"}` : " · all clear ✓"}
            </p>
          </div>
        </Link>
        <button
          onClick={() => setConfirmReset(true)}
          className="text-sm text-muted border border-tan rounded-xl px-3 py-2 active:bg-cream transition-colors"
        >
          Reset
        </button>
      </header>

      <div className="flex-1 px-4 pb-6 flex flex-col gap-3 overflow-y-auto">
        {orders.length === 0 && (
          <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted py-16">
            <span className="text-5xl opacity-40">☕</span>
            <p className="text-sm">No orders yet</p>
          </div>
        )}

        {/* Pending orders */}
        {pending.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            menu={menu}
            onDone={() => markDone(order.id)}
          />
        ))}

        {/* Done section */}
        {done.length > 0 && (
          <>
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-tan" />
              <span className="text-xs text-muted uppercase tracking-widest">Done</span>
              <div className="flex-1 h-px bg-tan" />
            </div>
            {done.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                menu={menu}
                done
                onRevert={() => setConfirmRevert(order.id)}
              />
            ))}
          </>
        )}
      </div>

      {/* Reset confirm dialog */}
      {confirmReset && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setConfirmReset(false)}
          />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-brew rounded-t-3xl shadow-2xl px-5 pt-5 pb-safe sheet-enter">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-tan" />
            </div>
            <h3
              className="text-xl text-bark mb-2"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              Clear all orders?
            </h3>
            <p className="text-sm text-muted mb-6">
              This will delete all pending and done orders. Can&apos;t be
              undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 py-4 rounded-2xl border border-tan text-bark text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={resetOrders}
                className="flex-1 py-4 rounded-2xl bg-bark text-brew text-sm font-semibold"
              >
                Clear all
              </button>
            </div>
          </div>
        </>
      )}
      {/* Revert confirm dialog */}
      {confirmRevert !== null && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setConfirmRevert(null)}
          />
          <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-50 bg-brew rounded-t-3xl shadow-2xl px-5 pt-5 pb-safe sheet-enter">
            <div className="flex justify-center mb-4">
              <div className="w-10 h-1 rounded-full bg-tan" />
            </div>
            <h3
              className="text-xl text-bark mb-2"
              style={{ fontFamily: "var(--font-lora)" }}
            >
              Mark as pending?
            </h3>
            <p className="text-sm text-muted mb-6">
              This order will move back to the pending queue.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRevert(null)}
                className="flex-1 py-4 rounded-2xl border border-tan text-bark text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => markPending(confirmRevert)}
                className="flex-1 py-4 rounded-2xl bg-amber text-white text-sm font-semibold"
              >
                Mark pending
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function OrderCard({
  order,
  menu,
  done = false,
  onDone,
  onRevert,
}: {
  order: Order;
  menu: Menu | null;
  done?: boolean;
  onDone?: () => void;
  onRevert?: () => void;
}) {
  const emoji = getEmoji(menu, order.drink_id);
  const chips = describeCustomizations(order.customizations, menu, order.drink_id);

  return (
    <button
      onClick={done ? onRevert : onDone}
      className={`w-full text-left rounded-2xl p-4 shadow-sm border transition-all order-enter
        ${done
          ? "bg-cream/50 border-tan/30 opacity-60 active:scale-[0.98]"
          : "bg-card border-tan/40 active:scale-[0.98]"
        }`}
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-bark text-base leading-snug">
            {order.guest_name}
          </p>
          <p className="text-bark mt-0.5">
            {emoji} {order.drink_name}
          </p>
          {chips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {chips.map((chip) => (
                <span
                  key={chip}
                  className="text-xs bg-cream text-amber px-2.5 py-1 rounded-full font-medium"
                >
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-xs text-muted">{timeAgo(order.created_at)}</span>
          {!done && (
            <span className="text-xs bg-amber/15 text-amber px-2 py-0.5 rounded-full font-medium">
              Tap to done
            </span>
          )}
          {done && (
            <span className="text-xs text-muted">tap to revert</span>
          )}
        </div>
      </div>
    </button>
  );
}
