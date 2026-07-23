import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useIsPremium } from "@/lib/premium-store";
import { PaymentModal } from "@/components/PaymentModal";

export function GlobalNavbar() {
  const isPremium = useIsPremium();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-agri-dark border-b-4 border-agri-dark">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl md:text-3xl font-black text-white tracking-tight">
            AGRIKARTA
          </Link>
          {isPremium ? (
            <Link
              to="/premium"
              className="bg-agri-amber text-agri-dark font-black px-4 py-2 md:px-6 md:py-3 border-4 border-agri-dark rounded-xl shadow-brutal-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-brutal-base inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" strokeWidth={3} />
              Premium Dashboard
            </Link>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="bg-agri-amber text-agri-dark font-black px-4 py-2 md:px-6 md:py-3 border-4 border-agri-dark rounded-xl shadow-brutal-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-brutal-base"
            >
              Beli Premium
            </button>
          )}
        </div>
      </nav>
      {open && <PaymentModal onClose={() => setOpen(false)} />}
    </>
  );
}
