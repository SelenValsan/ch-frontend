"use client";

import { useState, useEffect, useRef } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { apiFetch } from "../lib/api";
import { ITEM_SUGGESTIONS } from "../constants/items";

/* ================= TYPES ================= */

type Supplier = {
  id: number;
  name: string;
};

type Item = {
  itemName: string;
  quantity: string;
  pricePerUnit: string;
};

/* ================= ITEM AUTOCOMPLETE ================= */

function ItemAutocomplete({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [filtered, setFiltered] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value) {
      setFiltered([]);
      return;
    }

    const results = ITEM_SUGGESTIONS.filter((item) =>
      item.toLowerCase().includes(value.toLowerCase()),
    ).slice(0, 8);

    setFiltered(results);
    setOpen(results.length > 0);
  }, [value]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border rounded-lg px-3 py-2 w-full"
        placeholder="Item"
        onFocus={() => value && setOpen(true)}
      />

      {open && (
        <div className="absolute z-50 bg-white border rounded-lg shadow mt-1 w-full max-h-52 overflow-y-auto">
          {filtered.map((item, i) => (
            <div
              key={i}
              className="px-3 py-2 hover:bg-orange-100 cursor-pointer"
              onClick={() => {
                onChange(item);
                setOpen(false);
              }}
            >
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= MODAL ================= */

export default function AddTransactionModal({
  show,
  onClose,
  suppliers,
  onSuccess,
  defaultSupplierId,
}: {
  show: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  onSuccess: () => void;
  defaultSupplierId?: string; // ⭐ NEW
}) {
  const today = new Date().toISOString().split("T")[0];

  const [supplierId, setSupplierId] = useState(defaultSupplierId || "");

  const [items, setItems] = useState<Item[]>([
    { itemName: "", quantity: "", pricePerUnit: "" },
  ]);

  const [type, setType] = useState("PURCHASE");
  const [transactionDate, setTransactionDate] = useState(today);
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);

  /* ⭐ AUTO SELECT SUPPLIER WHEN OPENED FROM LEDGER */

  useEffect(() => {
    if (defaultSupplierId) {
      setSupplierId(defaultSupplierId);
    }
  }, [defaultSupplierId]);

  if (!show) return null;

  /* ================= ITEM MANAGEMENT ================= */

  const addItem = () => {
    setItems([...items, { itemName: "", quantity: "", pricePerUnit: "" }]);
  };

  const removeItem = (index: number) => {
    const copy = [...items];
    copy.splice(index, 1);
    setItems(copy);
  };

  const updateItem = (index: number, field: keyof Item, value: string) => {
    const copy = [...items];
    copy[index][field] = value;
    setItems(copy);
  };

  const calcAmount = (item: Item) => {
    const q = parseFloat(item.quantity || "0");
    const p = parseFloat(item.pricePerUnit || "0");
    return q * p;
  };

  /* ================= SAVE ================= */

  const submitTransaction = async () => {
    if (!supplierId) return alert("Select supplier");
    if (saving) return;

    setSaving(true);

    try {
      for (const item of items) {
        if (!item.itemName) continue;

        const amount = calcAmount(item);

        await apiFetch("/transactions", {
          method: "POST",
          body: JSON.stringify({
            supplierId: parseInt(supplierId),
            itemName: item.itemName,
            quantity: item.quantity ? parseFloat(item.quantity) : null,
            pricePerUnit: item.pricePerUnit
              ? parseFloat(item.pricePerUnit)
              : null,
            amount,
            type,
            description,
            transactionDate,
          }),
        });
      }

      onSuccess();
      onClose();

      /* reset form */

      setItems([{ itemName: "", quantity: "", pricePerUnit: "" }]);
      setDescription("");
      setSupplierId(defaultSupplierId || "");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[500px] max-h-[90vh] overflow-y-auto space-y-4">
        {/* HEADER */}

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Add Transaction</h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        {/* SUPPLIER */}

        <select
          className="w-full border rounded-lg px-3 py-2"
          value={supplierId}
          onChange={(e) => setSupplierId(e.target.value)}
        >
          <option value="">Select Supplier</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        {/* ITEMS */}

        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-4 gap-2 items-center">
            <ItemAutocomplete
              value={item.itemName}
              onChange={(v) => updateItem(i, "itemName", v)}
            />

            <input
              placeholder="Qty"
              className="border rounded-lg px-3 py-2"
              value={item.quantity}
              onChange={(e) => updateItem(i, "quantity", e.target.value)}
            />

            <input
              placeholder="Price"
              className="border rounded-lg px-3 py-2"
              value={item.pricePerUnit}
              onChange={(e) => updateItem(i, "pricePerUnit", e.target.value)}
            />

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">
                ₹ {calcAmount(item)}
              </span>

              {items.length > 1 && (
                <button onClick={() => removeItem(i)}>
                  <Trash2 size={16} className="text-red-500" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* ADD ITEM */}

        <button
          onClick={addItem}
          className="flex items-center gap-2 text-orange-600"
        >
          <Plus size={18} /> Add Item
        </button>

        {/* TYPE */}

        <select
          className="w-full border rounded-lg px-3 py-2"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="PURCHASE">Purchase</option>
          <option value="PAYMENT">Payment</option>
        </select>

        {/* DATE */}

        <input
          type="date"
          className="w-full border rounded-lg px-3 py-2"
          value={transactionDate}
          onChange={(e) => setTransactionDate(e.target.value)}
        />

        {/* DESCRIPTION */}

        <textarea
          className="w-full border rounded-lg px-3 py-2"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {/* SAVE */}

        <button
          disabled={saving}
          onClick={submitTransaction}
          className="w-full bg-orange-500 text-white py-2 rounded-lg"
        >
          {saving ? "Saving..." : "Save Transaction"}
        </button>
      </div>
    </div>
  );
}
