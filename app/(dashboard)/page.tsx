"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "../lib/api";

type Transaction = {
  id: number;
  type: "PURCHASE" | "PAYMENT";
  amount: number;
  itemName?: string;
  quantity?: number;
  description?: string;
  transactionDate: string;
  supplier: { name: string };
};

type Supplier = {
  id: number;
  name: string;
  balance: number;
};

type DashboardData = {
  supplierCount: number;
  transactionCount: number;
  totalBalance: number;
  latestTransactions: Transaction[];
  topSuppliers: Supplier[];
};

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const result = await apiFetch<DashboardData>("/dashboard");
        setData(result);
      } catch (err) {
        console.error("Dashboard load failed:", err);
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <div className="p-10 text-center">Loading dashboard...</div>;
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* ================= TOP KPI CARDS ================= */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-white rounded-2xl shadow p-5 md:p-6">
          <p className="text-gray-500 text-sm md:text-base">Suppliers</p>
          <h2 className="text-2xl md:text-3xl font-bold mt-2">
            {data.supplierCount}
          </h2>
        </div>

        <div className="bg-white rounded-2xl shadow p-5 md:p-6">
          <p className="text-gray-500 text-sm md:text-base">Transactions</p>
          <h2 className="text-2xl md:text-3xl font-bold mt-2">
            {data.transactionCount}
          </h2>
        </div>

        <div
          className={`rounded-2xl shadow p-5 md:p-6 text-white col-span-2 md:col-span-1 ${
            data.totalBalance >= 0 ? "bg-red-500" : "bg-green-500"
          }`}
        >
          <p className="text-sm md:text-base">Total Balance</p>
          <h2 className="text-2xl md:text-3xl font-bold mt-2">
            ₹ {Math.abs(data.totalBalance)}
          </h2>
          <p className="text-sm opacity-90">
            {data.totalBalance >= 0 ? "You owe suppliers" : "Suppliers owe you"}
          </p>
        </div>
      </div>

      {/* ================= RECENT TRANSACTIONS ================= */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Recent Transactions</h3>

          <Link
            href="/transactions"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            View All Transactions
          </Link>
        </div>

        <div className="space-y-4">
          {data.latestTransactions.map((tx) => (
            <div
              key={tx.id}
              className="border rounded-xl p-4 flex justify-between items-center hover:bg-gray-50 transition"
            >
              <div className="space-y-1">
                <p className="font-semibold text-base md:text-lg">
                  {tx.supplier.name}
                </p>

                <p className="text-sm text-gray-600">
                  {tx.itemName || "General Entry"}
                  {tx.quantity ? ` • Qty: ${tx.quantity}` : ""}
                </p>

                {tx.description && (
                  <p className="text-sm text-gray-500">{tx.description}</p>
                )}

                <p className="text-xs text-gray-400">
                  {new Date(tx.transactionDate).toLocaleDateString()}
                </p>
              </div>

              <div className="text-right">
                <p
                  className={`text-lg md:text-xl font-bold ${
                    tx.type === "PURCHASE" ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {tx.type === "PURCHASE" ? "+" : "-"} ₹ {tx.amount}
                </p>

                <p className="text-sm text-gray-400">
                  {tx.type === "PURCHASE" ? "You took goods" : "Payment made"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= TOP SUPPLIERS ================= */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Top Suppliers To Pay</h3>

          <Link
            href="/suppliers"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            View All Suppliers
          </Link>
        </div>

        {data.topSuppliers.length === 0 ? (
          <p className="text-gray-500">No outstanding dues 🎉</p>
        ) : (
          <div className="space-y-4">
            {data.topSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="flex justify-between items-center border rounded-xl p-4 hover:bg-gray-50 transition"
              >
                <div>
                  <p className="font-semibold text-base md:text-lg">
                    {supplier.name}
                  </p>
                  <p className="text-sm text-gray-500">Outstanding Balance</p>
                </div>

                <p className="text-red-600 text-lg md:text-xl font-bold">
                  ₹ {supplier.balance}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
