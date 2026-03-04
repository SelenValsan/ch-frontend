"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { apiFetch } from "../../lib/api";
import { Plus, X, ChevronDown, Trash2 } from "lucide-react";

/* ================= TYPES ================= */

type Supplier = {
  id: number;
  name: string;
};

type Transaction = {
  id: number;
  itemName?: string;
  quantity?: number;
  pricePerUnit?: number;
  description?: string;
  type: "PURCHASE" | "PAYMENT";
  amount: number;
  transactionDate: string;
  supplier: Supplier;
};

/* ================= GLOBAL CACHE ================= */

let supplierCache: Supplier[] | null = null;

/* ================= ITEM MASTER LIST ================= */

const ITEM_SUGGESTIONS = [
  "Koorka",
  "Chembe",
  "Sweet potato",
  "Ginger",
  "Watermelon",
  "Elevan",
  "Mathan",
  "Vellari",
  "Chena",
  "Coconut",
  "Onion",
  "Potato",
  "Nkaya",
  "Njalli",
  "Povan",
  "Robest",
  "Ckaya",
  "Kayypa",
  "Padavalam",
  "Cheryka",
  "Cholam",
  "Raddish",
  "Violet cabbage",
  "Cabbage",
  "Malli",
  "Pothina",
  "Vepila",
  "Kopra",
  "Carrot",
  "Lfinger",
  "Cucumber",
  "TR",
  "chilly",
  "Kondattam",
  "Amara",
  "Kamara",
  "Muringa",
  "Brinjal",
  "Thovara",
  "Kovai",
  "Tomato",
  "Expo",
  "Beans",
  "Cellary",
  "Capsicum",
  "R capsicum",
  "Y capsicum",
  "Cellery",
  "Leaves",
  "Spring onion",
  "Brocolli",
  "Baji mulakhe",
  "Baji kaya",
  "Mango",
  "Lemon",
  "Nelli",
  "Wpayar",
  "Rpayar",
  "Vpayar",
  "Ulli",
  "Garlic",
];

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
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
        placeholder="Item name..."
        onFocus={() => value && setOpen(true)}
      />

      {open && (
        <div className="absolute z-50 w-full bg-white border rounded-lg shadow mt-1 max-h-52 overflow-y-auto">
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

/* ================= SUPPLIER DROPDOWN ================= */

function SupplierDropdown({
  suppliers,
  value,
  onChange,
  placeholder = "Select Supplier",
}: {
  suppliers: Supplier[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = suppliers.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const selected = suppliers.find((s) => s.id.toString() === value);

  return (
    <div className="relative w-full" ref={ref}>
      <div
        className="border rounded-lg px-3 py-2 flex justify-between items-center cursor-pointer bg-white"
        onClick={() => setOpen(!open)}
      >
        <span>{selected ? selected.name : placeholder}</span>
        <ChevronDown size={16} />
      </div>

      {open && (
        <div className="absolute bg-white border rounded-lg mt-1 w-full shadow z-50">
          <input
            className="w-full px-3 py-2 border-b outline-none"
            placeholder="Search supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="max-h-52 overflow-y-auto">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  onChange(s.id.toString());
                  setOpen(false);
                }}
              >
                {s.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================= PAGE ================= */

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [type, setType] = useState("ALL");
  const [supplierId, setSupplierId] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    supplierId: "",
    itemName: "",
    quantity: "",
    pricePerUnit: "",
    amount: "",
    type: "PURCHASE",
    description: "",
    transactionDate: "",
  });

  /* debounce search */

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(t);
  }, [search]);

  /* auto amount */

  useEffect(() => {
    if (form.quantity && form.pricePerUnit) {
      const amt = parseFloat(form.quantity) * parseFloat(form.pricePerUnit);
      setForm((prev) => ({ ...prev, amount: amt.toString() }));
    }
  }, [form.quantity, form.pricePerUnit]);

  /* load suppliers */

  useEffect(() => {
    async function loadSuppliers() {
      if (supplierCache) return setSuppliers(supplierCache);
      const data = await apiFetch("/suppliers/list");
      supplierCache = data;
      setSuppliers(data);
    }
    loadSuppliers();
  }, []);

  /* load transactions */

  const loadTransactions = useCallback(async () => {
    const params = new URLSearchParams();

    params.append("page", page.toString());
    params.append("limit", "20");

    if (type !== "ALL") params.append("type", type);
    if (supplierId) params.append("supplierId", supplierId);
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (from) params.append("from", from);
    if (to) params.append("to", to);

    const res = await apiFetch(`/transactions?${params.toString()}`);

    setTransactions(res.data);
    setTotalPages(res.totalPages);
  }, [page, type, supplierId, debouncedSearch, from, to]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  /* CREATE TRANSACTION */

  const submitTransaction = async () => {
    if (!form.supplierId) return alert("Select supplier");

    await apiFetch("/transactions", {
      method: "POST",
      body: JSON.stringify({
        ...form,
        supplierId: parseInt(form.supplierId),
        quantity: form.quantity ? parseFloat(form.quantity) : null,
        pricePerUnit: form.pricePerUnit ? parseFloat(form.pricePerUnit) : null,
        amount: parseFloat(form.amount),
      }),
    });

    setShowModal(false);

    setForm({
      supplierId: "",
      itemName: "",
      quantity: "",
      pricePerUnit: "",
      amount: "",
      type: "PURCHASE",
      description: "",
      transactionDate: "",
    });

    loadTransactions();
  };

  /* DELETE TRANSACTION */

  const deleteTransaction = async (id: number) => {
    if (!confirm("Delete this transaction?")) return;

    try {
      await apiFetch(`/transactions/${id}`, {
        method: "DELETE",
      });

      loadTransactions();
    } catch (err: any) {
      alert(err.message || "Failed to delete transaction");
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Transactions</h1>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg"
        >
          <Plus size={18} /> Add Transaction
        </button>
      </div>

      {/* FILTER BAR */}

      <div className="bg-white rounded-2xl shadow p-4 grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <select
          className="border rounded-lg px-3 py-2"
          onChange={(e) => {
            setType(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">All</option>
          <option value="PURCHASE">Purchase</option>
          <option value="PAYMENT">Payment</option>
        </select>

        <SupplierDropdown
          suppliers={suppliers}
          value={supplierId}
          onChange={(v) => {
            setSupplierId(v);
            setPage(1);
          }}
          placeholder="All Suppliers"
        />

        <input
          className="border rounded-lg px-3 py-2"
          placeholder="Search item..."
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          type="date"
          className="border rounded-lg px-3 py-2"
          onChange={(e) => setFrom(e.target.value)}
        />

        <input
          type="date"
          className="border rounded-lg px-3 py-2"
          onChange={(e) => setTo(e.target.value)}
        />
      </div>

      {/* TABLE */}

      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="min-w-[900px] w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr className="text-sm text-gray-600">
              <th className="p-4">Date</th>
              <th className="p-4">Supplier</th>
              <th className="p-4">Item</th>
              <th className="p-4">Qty</th>
              <th className="p-4">Price</th>
              <th className="p-4">Type</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Description</th>
              <th className="p-4"></th>
            </tr>
          </thead>

          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  {new Date(t.transactionDate).toLocaleDateString()}
                </td>

                <td className="p-4">{t.supplier.name}</td>

                <td className="p-4">{t.itemName || "-"}</td>

                <td className="p-4">{t.quantity || "-"}</td>

                <td className="p-4">{t.pricePerUnit || "-"}</td>

                <td
                  className={`p-4 font-semibold ${
                    t.type === "PURCHASE" ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {t.type}
                </td>

                <td className="p-4 font-semibold">₹ {t.amount}</td>

                <td className="p-4 text-gray-500">{t.description || "-"}</td>

                <td className="p-4">
                  <button onClick={() => deleteTransaction(t.id)}>
                    <Trash2
                      className="text-red-500 hover:text-red-700"
                      size={18}
                    />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}

      <div className="flex justify-end gap-2">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="px-4 py-2 border rounded-lg"
        >
          Prev
        </button>

        <span className="px-4 py-2">
          Page {page}/{totalPages}
        </span>

        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="px-4 py-2 border rounded-lg"
        >
          Next
        </button>
      </div>

      {/* MODAL */}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[420px] max-h-[90vh] overflow-y-auto space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Add Transaction</h2>

              <button onClick={() => setShowModal(false)}>
                <X />
              </button>
            </div>

            <SupplierDropdown
              suppliers={suppliers}
              value={form.supplierId}
              onChange={(v) => setForm({ ...form, supplierId: v })}
            />

            <ItemAutocomplete
              value={form.itemName}
              onChange={(v) => setForm({ ...form, itemName: v })}
            />

            <div className="flex gap-2">
              <input
                className="w-1/2 border rounded-lg px-3 py-2"
                placeholder="Qty"
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />

              <input
                className="w-1/2 border rounded-lg px-3 py-2"
                placeholder="Price"
                onChange={(e) =>
                  setForm({
                    ...form,
                    pricePerUnit: e.target.value,
                  })
                }
              />
            </div>

            <input
              className="w-full border rounded-lg px-3 py-2 bg-gray-100"
              value={form.amount}
              readOnly
            />

            <select
              className="w-full border rounded-lg px-3 py-2"
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              <option value="PURCHASE">Purchase</option>
              <option value="PAYMENT">Payment</option>
            </select>

            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2"
              onChange={(e) =>
                setForm({
                  ...form,
                  transactionDate: e.target.value,
                })
              }
            />

            <textarea
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Description"
              onChange={(e) =>
                setForm({
                  ...form,
                  description: e.target.value,
                })
              }
            />

            <button
              onClick={submitTransaction}
              className="w-full bg-orange-500 text-white py-2 rounded-lg"
            >
              Save Transaction
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
