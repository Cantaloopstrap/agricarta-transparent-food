import { useState } from "react";
import { X, Loader2, MessageCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

type Stage = "form" | "loading";

export function PaymentModal({ onClose }: { onClose: () => void }) {
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState<Stage>("form");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setStage("loading");
    setErrorMessage(null);

    const nodeApiUrl = import.meta.env.VITE_NODE_API_URL || "http://localhost:5000";

    try {
      const response = await fetch(`${nodeApiUrl}/api/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phone }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Gagal membuat transaksi checkout.");
      }

      toast.success("Checkout berhasil dibuat! Mengalihkan ke Midtrans...");

      // Redirect user to Midtrans Snap payment gateway
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        throw new Error("Redirect URL Midtrans tidak ditemukan.");
      }
    } catch (err: any) {
      console.error("Error initiating checkout:", err);
      const msg = err.message || "Terjadi kesalahan saat menghubungkan ke payment gateway.";
      setErrorMessage(msg);
      toast.error(msg);
      setStage("form");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-agri-dark/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="relative bg-white border-4 border-agri-dark p-8 shadow-brutal-modal rounded-xl max-w-md w-full animate-scale-in">
        <button
          onClick={onClose}
          aria-label="Tutup"
          className="absolute -top-3 -right-3 bg-red-500 text-white border-4 border-agri-dark rounded-full w-10 h-10 flex items-center justify-center font-black shadow-brutal-sm hover:-translate-y-0.5 hover:shadow-brutal-base transition-all"
        >
          <X className="w-5 h-5" strokeWidth={3} />
        </button>

        {stage === "form" && (
          <>
            <div className="inline-block bg-agri-amber text-agri-dark font-black px-3 py-1 border-4 border-agri-dark rounded-lg shadow-brutal-sm mb-4 uppercase tracking-tight text-xs">
              Premium Checkout
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-agri-dark tracking-tight">
              Gabung Agrikarta Premium
            </h2>
            <p className="mt-2 font-bold text-agri-dark/70 text-sm">
              Masukkan nomor WhatsApp Anda. Magic Link akan dikirimkan langsung ke WA Anda setelah pembayaran.
            </p>

            {errorMessage && (
              <div className="mt-4 p-3 bg-red-100 border-2 border-red-500 rounded-lg flex items-center gap-2 text-red-700 text-sm font-bold">
                <AlertCircle className="w-5 h-5 shrink-0" />
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <label className="block">
                <span className="font-black text-agri-dark text-sm uppercase tracking-tight">
                  Nomor WhatsApp
                </span>
                <div className="relative mt-1">
                  <MessageCircle
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-agri-dark"
                    strokeWidth={3}
                  />
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    placeholder="628123456789"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full border-4 border-agri-dark bg-white rounded-lg pl-11 pr-4 py-3 font-bold text-agri-dark placeholder:text-agri-dark/40 outline-none focus:ring-4 focus:ring-agri-amber transition-shadow"
                  />
                </div>
              </label>

              <button
                type="submit"
                className="w-full bg-agri-amber text-agri-dark font-black text-lg px-6 py-3 border-4 border-agri-dark rounded-xl shadow-brutal-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-brutal-base"
              >
                Bayar Rp 50.000 via Midtrans
              </button>
            </form>
          </>
        )}

        {stage === "loading" && (
          <div className="py-8 flex flex-col items-center text-center">
            <Loader2 className="w-14 h-14 text-agri-dark animate-spin" strokeWidth={3} />
            <h3 className="mt-6 text-2xl font-black text-agri-dark tracking-tight">
              Menghubungkan ke Midtrans...
            </h3>
            <p className="mt-2 font-bold text-agri-dark/70 text-sm">
              Menyiapkan sesi pembayaran aman. Mohon tunggu...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
