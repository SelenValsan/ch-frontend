"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { apiFetch } from "../../lib/api";
import { Plus, ChevronRight, X, Pencil } from "lucide-react";

/* ================= TYPES ================= */

type Supplier = {
  id: number;
  name: string;
  phone?: string;
  note?: string;
  balance: number;
};

/* ================= GLOBAL CACHE ================= */

let supplierSummaryCache: Supplier[] | null = null;

/* ================= PAGE ================= */

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filtered, setFiltered] = useState<Supplier[]>([]);

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("desc");
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  /* ================= LOAD SUPPLIERS (CACHED) ================= */

  const loadSuppliers = useCallback(async () => {
    if (supplierSummaryCache) {
      setSuppliers(supplierSummaryCache);
      setFiltered(supplierSummaryCache);
      return;
    }

    const data = await apiFetch("/suppliers/summary");
    supplierSummaryCache = data;
    setSuppliers(data);
    setFiltered(data);
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  /* ================= FILTER ================= */

  useEffect(() => {
    let data = [...suppliers];

    if (typeFilter === "PURCHASE") data = data.filter((s) => s.balance > 0);
    if (typeFilter === "PAYMENT") data = data.filter((s) => s.balance <= 0);

    if (search) {
      const q = search.toLowerCase();
      data = data.filter(
        (s) =>
          s.name.toLowerCase().includes(q) || (s.phone ?? "").includes(search),
      );
    }

    data.sort((a, b) =>
      sortOrder === "desc" ? b.balance - a.balance : a.balance - b.balance,
    );

    setFiltered(data);
  }, [suppliers, typeFilter, sortOrder, search]);

  /* ================= MODAL ================= */

  const openAddModal = () => {
    setEditingSupplier(null);
    setName("");
    setPhone("");
    setNote("");
    setShowModal(true);
  };

  const openEditModal = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setName(supplier.name);
    setPhone(supplier.phone || "");
    setNote(supplier.note || "");
    setShowModal(true);
  };

  /* ================= SAVE ================= */

  const handleSave = async () => {
    if (!name.trim()) return alert("Supplier name required");

    if (editingSupplier) {
      await apiFetch(`/suppliers/${editingSupplier.id}`, {
        method: "PUT",
        body: JSON.stringify({ name, phone, note }),
      });
    } else {
      await apiFetch("/suppliers", {
        method: "POST",
        body: JSON.stringify({ name, phone, note }),
      });
    }

    setShowModal(false);

    // IMPORTANT: clear cache then reload
    supplierSummaryCache = null;
    await loadSuppliers();
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Suppliers</h1>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg shadow"
        >
          <Plus size={18} />
          Add Supplier
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-2xl shadow p-4 flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-sm text-gray-500">Type</label>
          <select
            className="block border rounded-lg px-3 py-2 mt-1"
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="PURCHASE">Payable</option>
            <option value="PAYMENT">Receivable</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-500">Amount Sort</label>
          <select
            className="block border rounded-lg px-3 py-2 mt-1"
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm text-gray-500">Search</label>
          <input
            type="text"
            placeholder="Search supplier..."
            className="block w-full border rounded-lg px-3 py-2 mt-1"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-2xl shadow">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr className="text-gray-600 text-sm">
                  <th className="p-4">Supplier</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">Note</th>
                  <th className="p-4">Balance</th>
                  <th className="p-4"></th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b hover:bg-gray-50">
                    <td className="p-4 font-medium">{s.name}</td>
                    <td className="p-4">{s.phone || "-"}</td>
                    <td className="p-4 text-gray-500">{s.note || "-"}</td>

                    <td
                      className={`p-4 font-semibold ${
                        s.balance > 0 ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      ₹ {Math.abs(s.balance)}
                    </td>

                    <td className="p-4 text-right space-x-3 whitespace-nowrap">
                      <button onClick={() => openEditModal(s)}>
                        <Pencil
                          className="inline text-blue-500 hover:text-blue-700"
                          size={18}
                        />
                      </button>

                      <Link href={`/suppliers/${s.id}`}>
                        <ChevronRight className="inline text-gray-400 hover:text-black" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-[400px] space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {editingSupplier ? "Edit Supplier" : "Add Supplier"}
              </h2>
              <button onClick={() => setShowModal(false)}>
                <X />
              </button>
            </div>

            <input
              type="text"
              placeholder="Supplier Name"
              className="w-full border rounded-lg px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type="text"
              placeholder="Phone Number"
              className="w-full border rounded-lg px-3 py-2"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <textarea
              placeholder="Note"
              className="w-full border rounded-lg px-3 py-2"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />

            <button
              onClick={handleSave}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 rounded-lg"
            >
              {editingSupplier ? "Update Supplier" : "Save Supplier"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
