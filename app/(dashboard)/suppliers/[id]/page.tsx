"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "../../../lib/api";

/* ================= TYPES ================= */

type Transaction = {
  id: number;
  type: "PURCHASE" | "PAYMENT";
  itemName?: string;
  quantity?: number;
  pricePerUnit?: number;
  description?: string;
  amount: number;
  date: string;
};

type LedgerResponse = {
  supplier: { id: number; name: string };
  ledger: Transaction[];
  totalTransactions: number;
  currentBalance: number;
};

/* ================= CACHE (VERY IMPORTANT) ================= */

const ledgerCache: Record<string, LedgerResponse> = {};

/* ================= PAGE ================= */

export default function SupplierLedgerPage() {
  const params = useParams();
  const supplierId = String(params.id);

  const [data, setData] = useState<LedgerResponse | null>(null);
  const [loading, setLoading] = useState(true);

  /* FILTERS */
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [searchItem, setSearchItem] = useState("");
  const [sortAmount, setSortAmount] = useState("desc");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ================= LOAD LEDGER (CACHED) ================= */

  useEffect(() => {
    if (!supplierId) return;

    async function load() {
      setLoading(true);

      // CACHE HIT (NO API CALL)
      if (ledgerCache[supplierId]) {
        setData(ledgerCache[supplierId]);
        setLoading(false);
        return;
      }

      const res = await apiFetch(`/suppliers/${supplierId}/ledger`);
      ledgerCache[supplierId] = res;
      setData(res);
      setLoading(false);
    }

    load();
  }, [supplierId]);

  /* ================= FILTERED DATA (OPTIMIZED) ================= */

  const filteredTransactions = useMemo(() => {
    if (!data) return [];

    let list = [...data.ledger];

    // Type
    if (typeFilter !== "ALL") {
      list = list.filter((t) => t.type === typeFilter);
    }

    // Item Search
    if (searchItem) {
      const s = searchItem.toLowerCase();
      list = list.filter((t) => (t.itemName || "").toLowerCase().includes(s));
    }

    // Date Range
    if (fromDate) {
      const from = new Date(fromDate);
      list = list.filter((t) => new Date(t.date) >= from);
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      list = list.filter((t) => new Date(t.date) <= to);
    }

    // Sort
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
      {/* SUPPLIER NAME */}
      <h1 className="text-3xl font-bold">{supplier.name}</h1>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4 md:gap-6">
        {/* TOTAL TRANSACTIONS */}
        <div
          className="
    bg-white
    rounded-2xl
    shadow
    p-4
    md:p-6
    aspect-square
    md:aspect-auto
    flex
    flex-col
    justify-center
  "
        >
          <p className="text-gray-500 text-sm md:text-base">
            Total Transactions
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mt-2">
            {totalTransactions}
          </h2>
        </div>

        {/* BALANCE */}
        <div
          className={`
      rounded-2xl
      shadow
      p-4
      md:p-6
      text-white
      aspect-square
      md:aspect-auto
      flex
      flex-col
      justify-center
      ${currentBalance >= 0 ? "bg-red-500" : "bg-green-500"}
    `}
        >
          <p className="text-sm md:text-base">
            {currentBalance >= 0 ? "Payable" : "Receivable"}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold mt-2">
            ₹ {Math.abs(currentBalance)}
          </h2>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white rounded-2xl shadow p-4">
        <div
          className="
    grid
    grid-cols-1
    sm:grid-cols-2
    lg:grid-cols-5
    gap-4
    items-start
  "
        >
          {/* TYPE */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-500 font-medium">Type</label>
            <select
              className="h-10 border rounded-lg px-3 w-full"
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="PURCHASE">Purchase</option>
              <option value="PAYMENT">Payment</option>
            </select>
          </div>

          {/* AMOUNT SORT */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-500 font-medium">
              Amount Sort
            </label>
            <select
              className="h-10 border rounded-lg px-3 w-full"
              onChange={(e) => setSortAmount(e.target.value)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>

          {/* ITEM SEARCH */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-500 font-medium">Item</label>
            <input
              className="h-10 border rounded-lg px-3 w-full"
              placeholder="Search item..."
              value={searchItem}
              onChange={(e) => setSearchItem(e.target.value)}
            />
          </div>

          {/* FROM DATE */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-500 font-medium">From</label>
            <input
              type="date"
              className="h-10 border rounded-lg px-3 w-full"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          {/* TO DATE */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-500 font-medium">To</label>
            <input
              type="date"
              className="h-10 border rounded-lg px-3 w-full"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TABLE (HORIZONTAL SCROLL ONLY HERE) */}
      <div className="bg-white rounded-2xl shadow">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <table className="w-full text-left">
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
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="p-4">{t.itemName || "-"}</td>
                    <td className="p-4">{t.quantity || "-"}</td>
                    <td className="p-4">{t.pricePerUnit || "-"}</td>
                    <td
                      className={`p-4 font-semibold ${
                        t.type === "PURCHASE"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {t.type}
                    </td>
                    <td className="p-4 font-semibold">₹ {t.amount}</td>
                    <td className="p-4 text-gray-500">
                      {t.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
