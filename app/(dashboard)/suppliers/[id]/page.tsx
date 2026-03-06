"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../lib/api";
import Link from "next/link";
import AddTransactionModal from "../../../components/AddTransactionModal";

/* ================= TYPES ================= */

type Supplier = {
  id: number;
  name: string;
};

type Transaction = {
  id: number;
  type: "PURCHASE" | "PAYMENT";
  itemName?: string;
  quantity?: number;
  pricePerUnit?: number;
  description?: string;
  amount: number;
  transactionDate: string;
};

type LedgerResponse = {
  supplier: { id: number; name: string };
  transactions: Transaction[];
  totalTransactions: number;
  currentBalance: number;
};

/* ================= CACHE ================= */

const ledgerCache: Record<string, LedgerResponse> = {};

/* ================= PAGE ================= */

export default function SupplierLedgerPage() {
  const params = useParams();
  const supplierId = String(params.id);

  const [data, setData] = useState<LedgerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showModal, setShowModal] = useState(false);

  /* FILTERS */

  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchItem, setSearchItem] = useState("");
  const [sortAmount, setSortAmount] = useState("desc");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ================= LOAD LEDGER ================= */

  const loadLedger = async () => {
    if (!supplierId) return;

    setLoading(true);

    if (ledgerCache[supplierId]) {
      setData(ledgerCache[supplierId]);
      setLoading(false);
      return;
    }

    const res = await apiFetch(`/suppliers/${supplierId}/ledger`);
    ledgerCache[supplierId] = res;
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    loadLedger();
  }, [supplierId]);

  /* ================= LOAD SUPPLIERS ================= */

  useEffect(() => {
    async function loadSuppliers() {
      const res = await apiFetch("/suppliers/list");
      setSuppliers(res);
    }

    loadSuppliers();
  }, []);

  /* ================= FILTER ================= */

  const filteredTransactions = useMemo(() => {
    if (!data) return [];

    let list = [...data.transactions];

    if (typeFilter !== "ALL") {
      list = list.filter((t) => t.type === typeFilter);
    }

    if (searchItem) {
      const s = searchItem.toLowerCase();
      list = list.filter((t) => (t.itemName || "").toLowerCase().includes(s));
    }

    if (fromDate) {
      const from = new Date(fromDate);
      list = list.filter((t) => new Date(t.transactionDate) >= from);
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      list = list.filter((t) => new Date(t.transactionDate) <= to);
    }

    list.sort((a, b) =>
      sortAmount === "desc" ? b.amount - a.amount : a.amount - b.amount,
    );

    return list;
  }, [data, typeFilter, searchItem, sortAmount, fromDate, toDate]);

  if (loading || !data)
    return <div className="text-lg font-medium">Loading ledger...</div>;

  const { supplier, totalTransactions, currentBalance } = data;

  /* ================= UI ================= */

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{supplier.name}</h1>

        <button
          onClick={() => setShowModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg"
        >
          + Add Transaction
        </button>
      </div>

      {/* SUMMARY */}

      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl shadow p-4 md:p-6">
          <p className="text-gray-500 text-sm">Total Transactions</p>
          <h2 className="text-2xl md:text-3xl font-bold mt-2">
            {totalTransactions}
          </h2>
        </div>

        <div
          className={`rounded-2xl shadow p-4 md:p-6 text-white ${
            currentBalance >= 0 ? "bg-red-500" : "bg-green-500"
          }`}
        >
          <p className="text-sm">
            {currentBalance >= 0 ? "Payable" : "Receivable"}
          </p>

          <h2 className="text-2xl md:text-3xl font-bold mt-2">
            ₹ {Math.abs(currentBalance)}
          </h2>
        </div>
      </div>

      {/* FILTER BAR */}

      <div className="bg-white rounded-2xl shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <select
            className="h-10 border rounded-lg px-3"
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">All</option>
            <option value="PURCHASE">Purchase</option>
            <option value="PAYMENT">Payment</option>
          </select>

          <select
            className="h-10 border rounded-lg px-3"
            onChange={(e) => setSortAmount(e.target.value)}
          >
            <option value="desc">Amount Desc</option>
            <option value="asc">Amount Asc</option>
          </select>

          <input
            className="h-10 border rounded-lg px-3"
            placeholder="Search item..."
            value={searchItem}
            onChange={(e) => setSearchItem(e.target.value)}
          />

          <input
            type="date"
            className="h-10 border rounded-lg px-3"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />

          <input
            type="date"
            className="h-10 border rounded-lg px-3"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      {/* TABLE */}

      <div className="bg-white rounded-2xl shadow overflow-x-auto">
        <table className="min-w-[900px] w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr className="text-gray-600 text-sm">
              <th className="p-4">Date</th>
              <th className="p-4">Item</th>
              <th className="p-4">Qty</th>
              <th className="p-4">Price</th>
              <th className="p-4">Type</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Description</th>
            </tr>
          </thead>

          <tbody>
            {filteredTransactions.map((t) => (
              <tr key={t.id} className="border-b hover:bg-gray-50">
                <td className="p-4">
                  {new Date(t.transactionDate).toLocaleDateString()}
                </td>

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
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TRANSACTION MODAL */}

      <AddTransactionModal
        show={showModal}
        onClose={() => setShowModal(false)}
        suppliers={suppliers}
        defaultSupplierId={supplierId}
        onSuccess={loadLedger}
      />
    </div>
  );
}
