import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { setPremium } from "@/lib/premium-store";
import { Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  component: AuthMagicLink,
});

function AuthMagicLink() {
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get("token");

    if (token) {
      localStorage.setItem("agrikarta_jwt_token", token);
      setPremium(true);
      toast.success("Magic Link terverifikasi! Akses Premium aktif.");

      const timer = setTimeout(() => {
        navigate({ to: "/premium" });
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      toast.error("Token Magic Link tidak ditemukan.");
      navigate({ to: "/" });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-agri-cream flex items-center justify-center p-6">
      <div className="bg-white border-4 border-agri-dark p-8 rounded-xl shadow-brutal-base text-center max-w-md w-full">
        <div className="bg-agri-forest text-white border-4 border-agri-dark rounded-full w-16 h-16 flex items-center justify-center shadow-brutal-sm mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" strokeWidth={3} />
        </div>
        <h1 className="text-2xl font-black text-agri-dark tracking-tight">
          Memverifikasi Magic Link...
        </h1>
        <p className="font-bold text-agri-dark/70 text-sm mt-2">
          Menghubungkan sesi premium Anda ke Agrikarta.
        </p>
        <div className="mt-6 flex justify-center">
          <Loader2 className="w-8 h-8 text-agri-dark animate-spin" strokeWidth={3} />
        </div>
      </div>
    </div>
  );
}
