"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { apiFetch } from "../lib/api";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const navLinks = [
    { name: "Dashboard", href: "/" },
    { name: "Suppliers", href: "/suppliers" },
    { name: "Transactions", href: "/transactions" },
  ];

  const linkStyle = (href: string) =>
    `block px-4 py-3 rounded-lg font-medium transition ${
      pathname === href
        ? "bg-orange-500 text-white"
        : "hover:bg-orange-100 hover:text-orange-600"
    }`;

  /* ================= LOGOUT FUNCTION ================= */
  const handleLogout = async () => {
    try {
      setLoading(true);

      // Call backend logout
      await apiFetch("/auth/logout", {
        method: "POST",
      });

      // Redirect to login
      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Logout failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ---------- MOBILE TOP BAR ---------- */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
            CH
          </div>
          <span className="text-lg font-semibold">Chirayath Vegitables</span>
        </div>

        <button onClick={() => setOpen(true)}>
          <Menu />
        </button>
      </div>

      {/* ---------- MOBILE DRAWER ---------- */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 md:hidden">
          <div className="w-64 bg-white h-full flex flex-col justify-between">
            <div>
              <div className="p-6 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                    CH
                  </div>
                  <span className="text-xl font-semibold">Chirayath Vegitables</span>
                </div>

                <button onClick={() => setOpen(false)}>
                  <X />
                </button>
              </div>

              <nav className="p-4 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={linkStyle(link.href)}
                    onClick={() => setOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="p-4 border-t">
              <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100">
                Settings
              </button>

              <button
                onClick={handleLogout}
                disabled={loading}
                className="w-full text-left px-4 py-3 rounded-lg text-red-500 hover:bg-red-50"
              >
                {loading ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- DESKTOP SIDEBAR ---------- */}
      <aside className="hidden md:flex w-64 bg-white border-r flex-col justify-between h-screen sticky top-0">
        <div>
          <div className="p-6 border-b flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              CH
            </div>
            <span className="text-xl font-semibold">Chirayath Vegitables</span>
          </div>

          <nav className="p-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={linkStyle(link.href)}
              >
                {link.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t">
          <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100">
            Settings
          </button>

          <button
            onClick={handleLogout}
            disabled={loading}
            className="w-full text-left px-4 py-3 rounded-lg text-red-500 hover:bg-red-50"
          >
            {loading ? "Logging out..." : "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}
