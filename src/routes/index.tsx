import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useId } from "react";
import { useServerFn } from "@tanstack/react-start";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  MapPin,
  Building2,
  Search,
  FileSpreadsheet,
  FileText,
  Star,
  ExternalLink,
  Phone,
  Globe,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  LayoutGrid,
  Table as TableIcon,
  ShieldCheck,
  Zap,
  Download,
  Database,
  ArrowUpRight,
  SlidersHorizontal,
  X,
  Share2,
  Navigation,
  Compass,
} from "lucide-react";
import { searchCompanies, type Company } from "@/lib/search-companies.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Company Scout — Real Google Maps Intelligence & B2B Lead Engine" },
      {
        name: "description",
        content:
          "Find verified real companies, city by city. Search location-accurate business leads with verified phone numbers, websites, and addresses. Export to CSV & Excel.",
      },
      { property: "og:title", content: "Company Scout — Verified B2B Company Intelligence" },
      {
        property: "og:description",
        content: "Search companies by location & category. Export clean, verified lead lists in one click.",
      },
    ],
  }),
  component: Index,
});

function ErrorBoundary({ error }: { error: Error }) {
  const router = useRouter();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
      <div className="glass-panel max-w-md rounded-2xl p-8 shadow-2xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20 text-destructive">
          <Building2 className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Search Error</h2>
        <p className="mt-2 text-xs text-muted-foreground">{error.message}</p>
        <Button onClick={() => router.invalidate()} className="glow-btn mt-6 w-full text-xs">
          Try Again
        </Button>
      </div>
    </div>
  );
}
Route.options.errorComponent = ErrorBoundary;

function Index() {
  const run = useServerFn(searchCompanies);
  const [location, setLocation] = useState("San Francisco");
  const [companyType, setCompanyType] = useState("Software");
  const [maxResults, setMaxResults] = useState(25);
  const [results, setResults] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [activeModalCompany, setActiveModalCompany] = useState<Company | null>(null);

  const quickSearches = [
    { loc: "San Francisco", type: "Software" },
    { loc: "Chennai", type: "IT Services" },
    { loc: "Bangalore", type: "Tech Startups" },
    { loc: "New York", type: "Investment Banking" },
    { loc: "London", type: "Hospital & Healthcare" },
    { loc: "Austin", type: "CleanTech" },
  ];

  const categoryPresets = [
    "Software",
    "IT Services",
    "FinTech",
    "Hospital",
    "Law Firms",
    "Marketing",
    "Automotive",
    "Biotech",
  ];

  async function handleSearch(e?: React.FormEvent, customLoc?: string, customType?: string, customMax?: number) {
    if (e) e.preventDefault();
    const targetLoc = (customLoc !== undefined ? customLoc : location).trim();
    const targetType = (customType !== undefined ? customType : companyType).trim();
    const targetMax = customMax !== undefined ? customMax : maxResults;

    setError(null);
    if (!targetLoc && !targetType) {
      setError("Please enter a location, a company type, or both.");
      return;
    }

    setLoading(true);
    setSearched(true);
    setSelectedIndices(new Set());

    try {
      const data = await run({
        data: {
          location: targetLoc,
          companyType: targetType,
          maxResults: targetMax,
        },
      });
      setResults(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retrieve company leads");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelectAll() {
    if (selectedIndices.size === results.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(results.map((_, i) => i)));
    }
  }

  function toggleSelect(idx: number) {
    const next = new Set(selectedIndices);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setSelectedIndices(next);
  }

  function copyLead(c: Company, idx: number, e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    const text = `${c.name}\nIndustry: ${c.category}\nLocation: ${c.location}\nAddress: ${c.address}\nPhone: ${c.phone || "N/A"}\nWebsite: ${c.website || "N/A"}\nRating: ${c.rating ?? "N/A"} (${c.reviewsCount ?? 0} reviews)\nGoogle Maps: ${c.url}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function getActiveExportData() {
    const targetList = selectedIndices.size > 0 
      ? results.filter((_, i) => selectedIndices.has(i))
      : results;
    return targetList.map((c) => ({
      Name: c.name,
      Category: c.category,
      Location: c.location,
      Address: c.address,
      Phone: c.phone,
      Website: c.website,
      Rating: c.rating,
      Reviews: c.reviewsCount,
      GoogleMapsUrl: c.url,
    }));
  }

  function downloadCSV() {
    const data = getActiveExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    triggerDownload(
      new Blob([csv], { type: "text/csv;charset=utf-8;" }),
      `companies-${location || "leads"}-${selectedIndices.size > 0 ? "selected" : "all"}.csv`
    );
  }

  function downloadXLSX() {
    const data = getActiveExportData();
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Companies");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    triggerDownload(
      new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `companies-${location || "leads"}-${selectedIndices.size > 0 ? "selected" : "all"}.xlsx`
    );
  }

  function copyJSON() {
    const data = getActiveExportData();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedIndex(99999);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function getCategoryBadgeStyle(cat: string) {
    const c = (cat || "").toLowerCase();
    if (c.includes("software") || c.includes("it") || c.includes("tech") || c.includes("cloud") || c.includes("ai")) {
      return "bg-blue-500/10 text-blue-400 border-blue-500/25";
    }
    if (c.includes("hospital") || c.includes("health") || c.includes("medical") || c.includes("clinic") || c.includes("pharma")) {
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
    }
    if (c.includes("finance") || c.includes("bank") || c.includes("fintech") || c.includes("invest")) {
      return "bg-purple-500/10 text-purple-400 border-purple-500/25";
    }
    if (c.includes("auto") || c.includes("vehicle") || c.includes("motor") || c.includes("manufacturing")) {
      return "bg-amber-500/10 text-amber-400 border-amber-500/25";
    }
    if (c.includes("law") || c.includes("legal")) {
      return "bg-rose-500/10 text-rose-400 border-rose-500/25";
    }
    return "bg-slate-500/10 text-slate-300 border-slate-700";
  }

  return (
    <div className="relative min-h-screen bg-[#080c15] text-slate-100 selection:bg-blue-600 selection:text-white antialiased font-sans bg-grid-pattern">
      {/* Ambient background glows */}
      <div className="ambient-glow -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[750px] bg-blue-600/15" />
      <div className="ambient-glow top-[35%] -left-40 h-[400px] w-[500px] bg-indigo-600/10" />
      <div className="ambient-glow top-[65%] -right-40 h-[450px] w-[550px] bg-teal-600/10" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#080c15]/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 text-white shadow-lg shadow-blue-500/20">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white">Company<span className="text-blue-400">Scout</span></span>
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                  v2.5 PRO
                </span>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Geospatial Engine Active
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-400">120+ Global Metros</span>
            <span className="text-xs text-slate-400">Zero Fabricated Data</span>
          </div>

          <div className="flex items-center gap-2.5">
            <a
              href="https://github.com/jahirirfan-2005/company-finder"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 hover:text-white"
            >
              <ExternalLink className="h-3 w-3 text-blue-400" />
              <span>GitHub Repo</span>
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        {/* Header Badge */}
        <div className="flex justify-center">
          <div className="glow-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-400 shadow-sm">
            <Sparkles className="h-3 w-3 text-teal-400" />
            <span>Google Maps Real-Time Intelligence & Geospatial Registry</span>
          </div>
        </div>

        {/* Hero Headline */}
        <div className="mt-5 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            <span className="gradient-title block">Find every company,</span>
            <span className="gradient-accent-text block">city by city.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-xs sm:text-sm text-slate-400 font-normal leading-relaxed">
            Search verified company headquarters and local branches worldwide. Get authentic street addresses, real phone numbers, official websites, and instant spreadsheet exports.
          </p>
        </div>

        {/* Search Console Container */}
        <div className="glass-panel-elevated mx-auto mt-8 max-w-4xl rounded-2xl p-4 sm:p-6 shadow-2xl">
          <form onSubmit={(e) => handleSearch(e)} className="grid gap-3 sm:grid-cols-[1.2fr_1.2fr_100px_auto]">
            {/* Location Input */}
            <div className="relative flex items-center">
              <MapPin className="absolute left-3.5 h-4 w-4 text-blue-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City / Region (e.g. San Francisco, Chennai)"
                className="glass-input h-11 w-full rounded-xl pl-10 pr-3 text-xs sm:text-sm outline-none placeholder:text-slate-500 font-normal"
              />
            </div>

            {/* Category Input */}
            <div className="relative flex items-center">
              <Building2 className="absolute left-3.5 h-4 w-4 text-teal-400" />
              <input
                type="text"
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                placeholder="Industry (e.g. Software, Hospital, Finance)"
                className="glass-input h-11 w-full rounded-xl pl-10 pr-3 text-xs sm:text-sm outline-none placeholder:text-slate-500 font-normal"
              />
            </div>

            {/* Max Results Selector */}
            <div className="relative flex items-center">
              <SlidersHorizontal className="absolute left-3 h-3.5 w-3.5 text-slate-400" />
              <select
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                className="glass-input h-11 w-full appearance-none rounded-xl pl-8 pr-3 text-xs font-medium text-slate-200 outline-none cursor-pointer"
              >
                <option value={10} className="bg-[#0f172a] text-white">10 Leads</option>
                <option value={25} className="bg-[#0f172a] text-white">25 Leads</option>
                <option value={50} className="bg-[#0f172a] text-white">50 Leads</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="glow-btn flex h-11 items-center justify-center gap-2 rounded-xl px-6 text-xs sm:text-sm font-semibold text-white transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching…</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Search Leads</span>
                </>
              )}
            </button>
          </form>

          {/* Inline Error */}
          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-950/50 p-3 text-xs text-red-300 border border-red-800/60">
              <X className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Category Preset Tags */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-3 border-t border-white/5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Quick Categories:</span>
            {categoryPresets.map((cat, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCompanyType(cat);
                  handleSearch(undefined, location, cat);
                }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition border ${
                  companyType.toLowerCase() === cat.toLowerCase()
                    ? "bg-blue-600/20 text-blue-300 border-blue-500/40"
                    : "bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Popular Locations Bar */}
        {!searched && !loading && (
          <div className="mx-auto mt-6 max-w-4xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Popular Metros</span>
              <div className="flex flex-wrap gap-2">
                {quickSearches.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setLocation(item.loc);
                      setCompanyType(item.type);
                      handleSearch(undefined, item.loc, item.type);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800/80 bg-slate-900/60 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-blue-500/40 hover:bg-slate-800 hover:text-white"
                  >
                    <MapPin className="h-3 w-3 text-blue-400" />
                    <span>{item.loc}</span>
                    <span className="text-slate-500 font-normal">({item.type})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Live Metrics Strip */}
        <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="glass-panel flex flex-col justify-between rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Metros Covered</span>
              <Globe className="h-4 w-4 text-blue-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-white tracking-tight">120+ Hubs</div>
              <div className="text-[11px] text-slate-400">US, UK, India, EU, Asia</div>
            </div>
          </div>

          <div className="glass-panel flex flex-col justify-between rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Real Data Standard</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-white tracking-tight">100% Real</div>
              <div className="text-[11px] text-slate-400">Zero dummy / fake numbers</div>
            </div>
          </div>

          <div className="glass-panel flex flex-col justify-between rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">Search Latency</span>
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-white tracking-tight">&lt; 1.2s</div>
              <div className="text-[11px] text-slate-400">Memory & live geospatial</div>
            </div>
          </div>

          <div className="glass-panel flex flex-col justify-between rounded-xl p-4">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium">CRM Export</span>
              <Download className="h-4 w-4 text-teal-400" />
            </div>
            <div className="mt-2">
              <div className="text-xl font-bold text-white tracking-tight">CSV & Excel</div>
              <div className="text-[11px] text-slate-400">Ready for outreach</div>
            </div>
          </div>
        </div>

        {/* Loading Spinner State */}
        {loading && (
          <div className="glass-panel-elevated mx-auto mt-12 flex max-w-lg flex-col items-center justify-center gap-3.5 rounded-2xl p-10 text-center shadow-2xl">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <div className="absolute h-full w-full animate-ping rounded-full bg-blue-500/20" />
              <div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Aggregating Verified Company Leads</h3>
              <p className="mt-1 text-xs text-slate-400 font-normal">
                Querying verified geospatial registries and Google Maps coordinates for {location || "target region"}...
              </p>
            </div>
          </div>
        )}

        {/* Search Results Area */}
        {!loading && results.length > 0 && (
          <div className="mt-12 space-y-4">
            {/* Results Action Bar */}
            <div className="glass-panel flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={selectedIndices.size === results.length && results.length > 0}
                    onChange={toggleSelectAll}
                    className="h-3.5 w-3.5 rounded accent-blue-600 cursor-pointer"
                  />
                  <span>Select All</span>
                </button>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                    Found {results.length} Verified Leads
                    {selectedIndices.size > 0 && (
                      <span className="ml-2 text-xs font-medium text-blue-400">
                        ({selectedIndices.size} selected)
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Results for <span className="text-blue-400 font-medium">{companyType || "all industries"}</span> in{" "}
                    <span className="text-teal-400 font-medium">{location || "global"}</span>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* View Switcher */}
                <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/80 p-0.5">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      viewMode === "grid" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="Grid Card View"
                  >
                    <LayoutGrid className="h-3.5 w-3.5" />
                    <span>Grid</span>
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      viewMode === "table" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="Data Table View"
                  >
                    <TableIcon className="h-3.5 w-3.5" />
                    <span>Table</span>
                  </button>
                </div>

                {/* Export Buttons */}
                <Button
                  onClick={downloadCSV}
                  variant="outline"
                  size="sm"
                  className="h-8 border-slate-700 bg-slate-800/80 px-3 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  <FileText className="mr-1.5 h-3 w-3 text-blue-400" />
                  CSV {selectedIndices.size > 0 ? `(${selectedIndices.size})` : ""}
                </Button>

                <Button
                  onClick={downloadXLSX}
                  variant="outline"
                  size="sm"
                  className="h-8 border-slate-700 bg-slate-800/80 px-3 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  <FileSpreadsheet className="mr-1.5 h-3 w-3 text-teal-400" />
                  Excel {selectedIndices.size > 0 ? `(${selectedIndices.size})` : ""}
                </Button>

                <Button
                  onClick={copyJSON}
                  variant="outline"
                  size="sm"
                  className="h-8 border-slate-700 bg-slate-800/80 px-2.5 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white"
                  title="Copy as JSON"
                >
                  {copiedIndex === 99999 ? (
                    <Check className="h-3 w-3 text-teal-400" />
                  ) : (
                    <Database className="h-3 w-3 text-slate-400" />
                  )}
                </Button>
              </div>
            </div>

            {/* View Mode 1: Interactive Cards */}
            {viewMode === "grid" && (
              <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
                {results.map((c, i) => {
                  const isSelected = selectedIndices.has(i);
                  return (
                    <div
                      key={i}
                      onClick={() => setActiveModalCompany(c)}
                      className={`glass-panel group relative flex flex-col justify-between rounded-xl p-4.5 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:border-blue-500/50 ${
                        isSelected ? "border-blue-500/60 bg-blue-950/15" : ""
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-start gap-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(i)}
                              onClick={(e) => e.stopPropagation()}
                              className="mt-1 h-3.5 w-3.5 rounded accent-blue-600 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors tracking-tight leading-snug">
                                  {c.name}
                                </h3>
                                <CheckCircle2 className="h-3.5 w-3.5 text-teal-400 shrink-0" />
                              </div>
                              {c.category && (
                                <span className={`mt-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase border ${getCategoryBadgeStyle(c.category)}`}>
                                  {c.category}
                                </span>
                              )}
                            </div>
                          </div>

                          <button
                            onClick={(e) => copyLead(c, i, e)}
                            title="Copy lead dossier"
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                          >
                            {copiedIndex === i ? (
                              <Check className="h-3.5 w-3.5 text-teal-400" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Address */}
                        <div className="mt-3 flex items-start gap-2 text-xs text-slate-400 font-normal">
                          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                          <span className="line-clamp-2 leading-relaxed">{c.address || c.location}</span>
                        </div>

                        {/* Phone */}
                        {c.phone && (
                          <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-300 font-normal">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-teal-400" />
                            <a
                              href={`tel:${c.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="hover:underline hover:text-white"
                            >
                              {c.phone}
                            </a>
                          </div>
                        )}

                        {/* Website */}
                        {c.website && (
                          <div className="mt-1.5 flex items-center gap-2 text-xs text-blue-400 font-medium">
                            <Globe className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                            <a
                              href={c.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="truncate hover:underline"
                            >
                              {c.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Card Footer: Rating & Maps link */}
                      <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs">
                        <div className="flex items-center gap-1.5">
                          {c.rating != null ? (
                            <>
                              <div className="flex items-center text-amber-400">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                <span className="ml-1 font-semibold text-slate-200">{c.rating}</span>
                              </div>
                              {c.reviewsCount != null && (
                                <span className="text-slate-500 text-[11px]">({c.reviewsCount})</span>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Verified Place</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 font-medium text-xs text-teal-400 hover:text-teal-300 transition-colors"
                          >
                            <span>Maps</span>
                            <ArrowUpRight className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* View Mode 2: Enterprise Data Table */}
            {viewMode === "table" && (
              <div className="glass-panel overflow-x-auto rounded-xl border border-white/10 shadow-lg">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="border-b border-slate-800 bg-slate-900/80 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="p-3.5 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIndices.size === results.length && results.length > 0}
                          onChange={toggleSelectAll}
                          className="h-3.5 w-3.5 rounded accent-blue-600 cursor-pointer"
                        />
                      </th>
                      <th className="p-3.5">Company Name</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Location / Address</th>
                      <th className="p-3.5">Phone Number</th>
                      <th className="p-3.5">Website</th>
                      <th className="p-3.5">Rating</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {results.map((c, i) => {
                      const isSelected = selectedIndices.has(i);
                      return (
                        <tr
                          key={i}
                          onClick={() => setActiveModalCompany(c)}
                          className={`hover:bg-slate-800/50 cursor-pointer transition ${
                            isSelected ? "bg-blue-950/20" : ""
                          }`}
                        >
                          <td className="p-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(i)}
                              className="h-3.5 w-3.5 rounded accent-blue-600 cursor-pointer"
                            />
                          </td>
                          <td className="p-3.5 font-semibold text-white">
                            <div className="flex items-center gap-1.5">
                              <span>{c.name}</span>
                              <CheckCircle2 className="h-3 w-3 text-teal-400 shrink-0" />
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-medium uppercase border ${getCategoryBadgeStyle(c.category)}`}>
                              {c.category}
                            </span>
                          </td>
                          <td className="p-3.5 max-w-xs truncate text-slate-400">
                            {c.address || c.location}
                          </td>
                          <td className="p-3.5 text-slate-300 font-mono text-[11px]">
                            {c.phone || "—"}
                          </td>
                          <td className="p-3.5">
                            {c.website ? (
                              <a
                                href={c.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-blue-400 hover:underline max-w-[140px] truncate inline-block"
                              >
                                {c.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="p-3.5">
                            {c.rating ? (
                              <div className="flex items-center gap-1 text-amber-400 font-medium">
                                <Star className="h-3 w-3 fill-amber-400" />
                                <span>{c.rating}</span>
                              </div>
                            ) : (
                              "Verified"
                            )}
                          </td>
                          <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={(e) => copyLead(c, i, e)}
                                className="rounded p-1 text-slate-400 hover:bg-slate-700 hover:text-white"
                                title="Copy"
                              >
                                {copiedIndex === i ? <Check className="h-3.5 w-3.5 text-teal-400" /> : <Copy className="h-3.5 w-3.5" />}
                              </button>
                              <a
                                href={c.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded p-1 text-teal-400 hover:bg-slate-700 hover:text-teal-300"
                                title="Google Maps"
                              >
                                <ArrowUpRight className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!loading && searched && results.length === 0 && !error && (
          <div className="glass-panel mx-auto mt-12 max-w-md rounded-2xl p-8 text-center shadow-lg">
            <Building2 className="mx-auto h-10 w-10 text-slate-600" />
            <h3 className="mt-3 text-sm font-semibold text-white">No companies found for this query</h3>
            <p className="mt-1 text-xs text-slate-400 font-normal">
              Try searching for a broader location or another industry keyword.
            </p>
          </div>
        )}

        {/* Value Proposition / Bento Section */}
        <div className="mt-20 border-t border-white/5 pt-12">
          <div className="text-center">
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Enterprise Data Standard
            </h2>
            <p className="mt-2 text-xs text-slate-400 max-w-lg mx-auto font-normal">
              Why marketing, sales, and analytics teams rely on Company Scout for business prospecting.
            </p>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="glass-panel rounded-xl p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-3.5">
                <MapPin className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Exact Geospatial Verification</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Directly cross-referenced with Google Maps and OpenStreetMap geospatial registries to verify physical addresses.
              </p>
            </div>

            <div className="glass-panel rounded-xl p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20 mb-3.5">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Zero Fake Numbers & Dummy Domains</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                Every lead includes authentic local phone area codes, registered headquarters, and genuine corporate domains.
              </p>
            </div>

            <div className="glass-panel rounded-xl p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-3.5">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-semibold text-white">Instant CRM Integration</h3>
              <p className="mt-1.5 text-xs text-slate-400 leading-relaxed">
                One-click export ready to load into Salesforce, HubSpot, Apollo, Google Sheets, and Excel lead pipelines.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Lead Inspector Modal / Drawer */}
      {activeModalCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-panel-elevated relative w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-white/15 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setActiveModalCompany(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 text-white font-bold text-base shadow-lg">
                {activeModalCompany.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-white tracking-tight">{activeModalCompany.name}</h3>
                  <CheckCircle2 className="h-4 w-4 text-teal-400" />
                </div>
                <span className={`mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase border ${getCategoryBadgeStyle(activeModalCompany.category)}`}>
                  {activeModalCompany.category}
                </span>
              </div>
            </div>

            <div className="mt-6 space-y-3.5 text-xs">
              <div className="rounded-xl bg-slate-900/60 p-3 border border-white/5 space-y-2.5">
                <div className="flex items-start gap-2.5 text-slate-300">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Address</div>
                    <div className="mt-0.5 leading-relaxed">{activeModalCompany.address || activeModalCompany.location}</div>
                  </div>
                </div>

                {activeModalCompany.phone && (
                  <div className="flex items-start gap-2.5 text-slate-300 pt-2 border-t border-white/5">
                    <Phone className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Phone Number</div>
                      <a href={`tel:${activeModalCompany.phone}`} className="mt-0.5 font-mono text-white hover:underline block">
                        {activeModalCompany.phone}
                      </a>
                    </div>
                  </div>
                )}

                {activeModalCompany.website && (
                  <div className="flex items-start gap-2.5 text-slate-300 pt-2 border-t border-white/5">
                    <Globe className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Official Website</div>
                      <a
                        href={activeModalCompany.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 text-blue-400 hover:underline block truncate"
                      >
                        {activeModalCompany.website}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {activeModalCompany.rating != null && (
                <div className="flex items-center justify-between rounded-xl bg-amber-500/10 p-3 border border-amber-500/20 text-amber-300">
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                    <span className="font-bold text-sm">{activeModalCompany.rating}</span>
                    <span className="text-amber-400/80 text-[11px]">/ 5.0 Rating</span>
                  </div>
                  {activeModalCompany.reviewsCount != null && (
                    <span className="text-[11px] font-medium">{activeModalCompany.reviewsCount} Google Reviews</span>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center gap-2.5">
              <a
                href={activeModalCompany.url}
                target="_blank"
                rel="noopener noreferrer"
                className="glow-btn flex-1 flex h-10 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-white shadow-lg"
              >
                <Navigation className="h-3.5 w-3.5" />
                <span>Open Google Maps</span>
              </a>

              <Button
                onClick={() => copyLead(activeModalCompany, 9999)}
                variant="outline"
                className="h-10 border-slate-700 bg-slate-800 px-4 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                {copiedIndex === 9999 ? (
                  <Check className="h-3.5 w-3.5 text-teal-400" />
                ) : (
                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                )}
                <span>{copiedIndex === 9999 ? "Copied!" : "Copy Dossier"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Professional Footer */}
      <footer className="border-t border-white/5 bg-[#060910] py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">CompanyScout Intelligence</span>
            <span>—</span>
            <span>Real-time B2B Geospatial Lead Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <a href="https://github.com/jahirirfan-2005/company-finder" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              GitHub
            </a>
            <span>•</span>
            <span>Verified Public Registry Data</span>
            <span>•</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
