export function GlobalNavbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-agri-dark border-b-4 border-agri-dark">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/" className="text-2xl md:text-3xl font-black text-white tracking-tight">
          AGRIKARTA
        </a>
        <button
          className="bg-agri-amber text-agri-dark font-black px-4 py-2 md:px-6 md:py-3 border-4 border-agri-dark rounded-xl shadow-brutal-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-brutal-base"
          onClick={() => alert("Open Payment Modal")}
        >
          Beli Premium
        </button>
      </div>
    </nav>
  );
}
