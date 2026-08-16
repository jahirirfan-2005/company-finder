import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
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
  FolderTree,
  ShieldCheck,
  Zap,
  Download,
  Database,
  ArrowUpRight,
  SlidersHorizontal,
  X,
  Navigation,
  Compass,
  Laptop,
  Stethoscope,
  Landmark,
  Car,
  Scale,
  Building,
  Megaphone,
  GraduationCap,
  Layers,
} from "lucide-react";
import { searchCompanies, type Company } from "@/lib/search-companies.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Company Scout — Real Category & Location-Based Company Intelligence" },
      {
        name: "description",
        content:
          "Find verified real companies category-wise and location-wise. Real street addresses, phone numbers, websites, and instant spreadsheet exports.",
      },
      { property: "og:title", content: "Company Scout — Real Category & Location B2B Intelligence" },
      {
        property: "og:description",
        content: "Search real companies category-wise by location. Export clean lead lists in one click.",
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

// Standard Category Directory Cards
const CATEGORY_DIRECTORY = [
  { id: "all", name: "All Categories", icon: Layers, query: "", color: "from-blue-500 to-indigo-500" },
  { id: "tech", name: "IT & Software", icon: Laptop, query: "Software", color: "from-blue-500 to-cyan-500" },
  { id: "health", name: "Healthcare & Hospitals", icon: Stethoscope, query: "Hospital", color: "from-emerald-500 to-teal-500" },
  { id: "finance", name: "Banking & FinTech", icon: Landmark, query: "Finance", color: "from-purple-500 to-pink-500" },
  { id: "auto", name: "Automotive & Manufacturing", icon: Car, query: "Automotive", color: "from-amber-500 to-orange-500" },
  { id: "legal", name: "Legal & Law Firms", icon: Scale, query: "Law", color: "from-rose-500 to-red-500" },
  { id: "realestate", name: "Real Estate & Builders", icon: Building, query: "Real Estate", color: "from-sky-500 to-blue-600" },
  { id: "marketing", name: "Marketing & Media", icon: Megaphone, query: "Marketing", color: "from-violet-500 to-purple-600" },
  { id: "edu", name: "Education & Universities", icon: GraduationCap, query: "University", color: "from-yellow-500 to-amber-600" },
];

function normalizeCategoryGroup(cat: string): string {
  const c = (cat || "").toLowerCase();
  if (c.includes("software") || c.includes("it") || c.includes("tech") || c.includes("cloud") || c.includes("saas") || c.includes("ai") || c.includes("digital") || c.includes("computer")) {
    return "IT & Software";
  }
  if (c.includes("hospital") || c.includes("health") || c.includes("medical") || c.includes("clinic") || c.includes("pharma") || c.includes("doctor") || c.includes("biotech")) {
    return "Healthcare & Hospitals";
  }
  if (c.includes("finance") || c.includes("bank") || c.includes("fintech") || c.includes("invest") || c.includes("capital") || c.includes("wealth") || c.includes("insurance")) {
    return "Banking, Finance & FinTech";
  }
  if (c.includes("auto") || c.includes("vehicle") || c.includes("motor") || c.includes("manufacturing") || c.includes("tyre") || c.includes("industrial") || c.includes("engineering")) {
    return "Automotive & Manufacturing";
  }
  if (c.includes("law") || c.includes("legal") || c.includes("attorney") || c.includes("advocate") || c.includes("solicitor")) {
    return "Legal & Advisory";
  }
  if (c.includes("real estate") || c.includes("property") || c.includes("builder") || c.includes("construction") || c.includes("architect")) {
    return "Real Estate & Construction";
  }
  if (c.includes("market") || c.includes("media") || c.includes("advertising") || c.includes("pr") || c.includes("creative")) {
    return "Marketing & Media";
  }
  if (c.includes("school") || c.includes("college") || c.includes("university") || c.includes("education") || c.includes("academy") || c.includes("institute")) {
    return "Education & Research";
  }
  return "General Commercial & Services";
}

function Index() {
  const run = useServerFn(searchCompanies);
  const [location, setLocation] = useState("Chennai");
  const [companyType, setCompanyType] = useState("");
  const [maxResults, setMaxResults] = useState(30);
  const [results, setResults] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "grouped" | "table">("grouped");
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [activeModalCompany, setActiveModalCompany] = useState<Company | null>(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>("all");

  const quickSearches = [
    { loc: "Chennai", label: "Chennai All Sectors", type: "" },
    { loc: "Bangalore", label: "Bangalore Tech & FinTech", type: "Tech" },
    { loc: "Mumbai", label: "Mumbai Banking & Auto", type: "Banking" },
    { loc: "Hyderabad", label: "Hyderabad IT & Pharma", type: "Pharma" },
    { loc: "San Francisco", label: "Silicon Valley Tech", type: "Software" },
    { loc: "New York", label: "New York Finance & Health", type: "Finance" },
    { loc: "London", label: "London Healthcare & FinTech", type: "Hospital" },
  ];

  async function handleSearch(e?: React.FormEvent, customLoc?: string, customType?: string, customMax?: number) {
    if (e) e.preventDefault();
    const targetLoc = (customLoc !== undefined ? customLoc : location).trim();
    const targetType = (customType !== undefined ? customType : companyType).trim();
    const targetMax = customMax !== undefined ? customMax : maxResults;

    setError(null);
    if (!targetLoc && !targetType) {
      setError("Please enter a location, a company category, or both.");
      return;
    }

    setLoading(true);
    setSearched(true);
    setSelectedIndices(new Set());
    setActiveCategoryFilter("all");

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

  // Derive unique categories present in the current results
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const r of results) {
      const group = normalizeCategoryGroup(r.category);
      counts[group] = (counts[group] || 0) + 1;
    }
    return counts;
  }, [results]);

  // Filter results by active category tab if selected
  const filteredResults = useMemo(() => {
    if (activeCategoryFilter === "all") return results;
    return results.filter((r) => normalizeCategoryGroup(r.category) === activeCategoryFilter);
  }, [results, activeCategoryFilter]);

  // Grouped results for the "Grouped Category View"
  const groupedResults = useMemo(() => {
    const groups: Record<string, { company: Company; originalIndex: number }[]> = {};
    results.forEach((c, idx) => {
      const group = normalizeCategoryGroup(c.category);
      if (!groups[group]) groups[group] = [];
      groups[group].push({ company: c, originalIndex: idx });
    });
    return groups;
  }, [results]);

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
    const text = `${c.name}\nCategory: ${c.category}\nLocation: ${c.location}\nAddress: ${c.address}\nPhone: ${c.phone || "N/A"}\nWebsite: ${c.website || "N/A"}\nRating: ${c.rating ?? "N/A"} (${c.reviewsCount ?? 0} reviews)\nGoogle Maps: ${c.url}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function getActiveExportData() {
    const targetList = selectedIndices.size > 0 
      ? results.filter((_, i) => selectedIndices.has(i))
      : filteredResults;
    return targetList.map((c) => ({
      Name: c.name,
      Category: c.category,
      CategoryGroup: normalizeCategoryGroup(c.category),
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
      `companies-${location || "leads"}-${activeCategoryFilter !== "all" ? activeCategoryFilter : "all-categories"}.csv`
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
      `companies-${location || "leads"}-${activeCategoryFilter !== "all" ? activeCategoryFilter : "all-categories"}.xlsx`
    );
  }

  function copyJSON() {
    const data = getActiveExportData();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedIndex(99999);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function getCategoryBadgeStyle(cat: string) {
    const group = normalizeCategoryGroup(cat);
    switch (group) {
      case "IT & Software":
        return "bg-blue-500/10 text-blue-400 border-blue-500/25";
      case "Healthcare & Hospitals":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/25";
      case "Banking, Finance & FinTech":
        return "bg-purple-500/10 text-purple-400 border-purple-500/25";
      case "Automotive & Manufacturing":
        return "bg-amber-500/10 text-amber-400 border-amber-500/25";
      case "Legal & Advisory":
        return "bg-rose-500/10 text-rose-400 border-rose-500/25";
      case "Real Estate & Construction":
        return "bg-sky-500/10 text-sky-400 border-sky-500/25";
      case "Marketing & Media":
        return "bg-violet-500/10 text-violet-400 border-violet-500/25";
      case "Education & Research":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/25";
      default:
        return "bg-slate-500/10 text-slate-300 border-slate-700";
    }
  }

  function getCategoryIcon(group: string) {
    switch (group) {
      case "IT & Software": return Laptop;
      case "Healthcare & Hospitals": return Stethoscope;
      case "Banking, Finance & FinTech": return Landmark;
      case "Automotive & Manufacturing": return Car;
      case "Legal & Advisory": return Scale;
      case "Real Estate & Construction": return Building;
      case "Marketing & Media": return Megaphone;
      case "Education & Research": return GraduationCap;
      default: return Building2;
    }
  }

  return (
    <div className="relative min-h-screen bg-[#080c15] text-slate-100 selection:bg-blue-600 selection:text-white antialiased font-sans bg-grid-pattern">
      {/* Ambient background glows */}
      <div className="ambient-glow -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[750px] bg-blue-600/15" />
      <div className="ambient-glow top-[35%] -left-40 h-[400px] w-[500px] bg-indigo-600/10" />
      <div className="ambient-glow top-[65%] -right-40 h-[450px] w-[550px] bg-teal-600/10" />

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#080c15]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-teal-400 text-white shadow-lg shadow-blue-500/20">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-white">Company<span className="text-blue-400">Scout</span></span>
                <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-400 border border-blue-500/20">
                  CATEGORY & LOCATION ENGINE
                </span>
              </div>
            </div>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              100% Real Location & Category Data
            </span>
            <span className="text-xs text-slate-400">|</span>
            <span className="text-xs text-slate-400">Verified Phone & Web Links</span>
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

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        {/* Header Badge */}
        <div className="flex justify-center">
          <div className="glow-pill inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-400 shadow-sm">
            <Sparkles className="h-3 w-3 text-teal-400" />
            <span>Category-Wise & Location-Based Real Intelligence</span>
          </div>
        </div>

        {/* Hero Headline */}
        <div className="mt-4 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
            <span className="gradient-title block">Real Companies by Category,</span>
            <span className="gradient-accent-text block">Location by Location.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-xs sm:text-sm text-slate-400 font-normal leading-relaxed">
            Explore verified real-world enterprises categorized by industry across major global cities. View authentic street addresses, direct phone numbers, official websites, and export to CSV or Excel.
          </p>
        </div>

        {/* Search Console Container */}
        <div className="glass-panel-elevated mx-auto mt-7 max-w-4xl rounded-2xl p-4 sm:p-6 shadow-2xl">
          <form onSubmit={(e) => handleSearch(e)} className="grid gap-3 sm:grid-cols-[1.3fr_1.3fr_110px_auto]">
            {/* Location Input */}
            <div className="relative flex items-center">
              <MapPin className="absolute left-3.5 h-4 w-4 text-blue-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location (e.g. Chennai, Bangalore, SF)"
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
                placeholder="Category (e.g. IT, Hospital, Finance, or All)"
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
                <option value={15} className="bg-[#0f172a] text-white">15 Leads</option>
                <option value={30} className="bg-[#0f172a] text-white">30 Leads</option>
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
                  <span>Explore Leads</span>
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

          {/* Location Quick Presets */}
          <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-3 border-t border-white/5">
            <span className="text-[11px] font-semibold text-slate-400 mr-1">Popular Locations:</span>
            {quickSearches.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setLocation(item.loc);
                  setCompanyType(item.type);
                  handleSearch(undefined, item.loc, item.type);
                }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition border ${
                  location.toLowerCase() === item.loc.toLowerCase() && companyType.toLowerCase() === item.type.toLowerCase()
                    ? "bg-blue-600/20 text-blue-300 border-blue-500/40"
                    : "bg-slate-900/50 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <MapPin className="mr-1 inline h-2.5 w-2.5 text-blue-400" />
                <span>{item.loc}</span>
                {item.type && <span className="ml-1 text-slate-500">({item.type})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Category Directory Browser Cards (Instant 1-Click Category Filter) */}
        <div className="mx-auto mt-7 max-w-5xl">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FolderTree className="h-3.5 w-3.5 text-blue-400" />
              <span>Browse by Category in {location || "Selected City"}</span>
            </h2>
            <span className="text-[11px] text-slate-500">Click any category to search instantly</span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {CATEGORY_DIRECTORY.slice(1).map((cat) => {
              const Icon = cat.icon;
              const isSelected = companyType.toLowerCase() === cat.query.toLowerCase() && cat.query !== "";
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCompanyType(cat.query);
                    handleSearch(undefined, location, cat.query);
                  }}
                  className={`glass-panel group relative flex items-center gap-2.5 rounded-xl p-2.5 text-left transition hover:-translate-y-0.5 hover:border-blue-500/50 ${
                    isSelected ? "border-blue-500 bg-blue-950/30 text-white" : "text-slate-300"
                  }`}
                >
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr ${cat.color} text-white shadow-sm`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold truncate group-hover:text-blue-300 transition-colors">
                      {cat.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="glass-panel-elevated mx-auto mt-12 flex max-w-lg flex-col items-center justify-center gap-3.5 rounded-2xl p-10 text-center shadow-2xl">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <div className="absolute h-full w-full animate-ping rounded-full bg-blue-500/20" />
              <div className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Aggregating Category-Wise Real Intelligence</h3>
              <p className="mt-1 text-xs text-slate-400 font-normal">
                Querying verified local company registries for {companyType || "all categories"} in {location || "all cities"}...
              </p>
            </div>
          </div>
        )}

        {/* Search Results Area */}
        {!loading && results.length > 0 && (
          <div className="mt-10 space-y-4">
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
                    Found {filteredResults.length} Real Leads
                    {selectedIndices.size > 0 && (
                      <span className="ml-2 text-xs font-medium text-blue-400">
                        ({selectedIndices.size} selected)
                      </span>
                    )}
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Location: <span className="text-teal-400 font-medium">{location || "All Metros"}</span>
                    {companyType && <> • Category: <span className="text-blue-400 font-medium">{companyType}</span></>}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* View Switcher: Grouped vs Grid vs Table */}
                <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/80 p-0.5">
                  <button
                    onClick={() => setViewMode("grouped")}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      viewMode === "grouped" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                    }`}
                    title="Category-Wise Grouped View"
                  >
                    <FolderTree className="h-3.5 w-3.5" />
                    <span>Category Wise</span>
                  </button>
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

            {/* Dynamic Category Filter Pills (When multiple categories exist) */}
            {Object.keys(categoryStats).length > 1 && (
              <div className="flex flex-wrap items-center gap-2 p-1">
                <button
                  onClick={() => setActiveCategoryFilter("all")}
                  className={`rounded-lg px-3 py-1 text-xs font-semibold transition border ${
                    activeCategoryFilter === "all"
                      ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                      : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  All Categories ({results.length})
                </button>
                {Object.entries(categoryStats).map(([catGroup, count]) => {
                  const Icon = getCategoryIcon(catGroup);
                  const isActive = activeCategoryFilter === catGroup;
                  return (
                    <button
                      key={catGroup}
                      onClick={() => setActiveCategoryFilter(isActive ? "all" : catGroup)}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition border ${
                        isActive
                          ? "bg-blue-600 text-white border-blue-500 shadow-sm"
                          : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                      }`}
                    >
                      <Icon className="h-3 w-3" />
                      <span>{catGroup}</span>
                      <span className="rounded-full bg-white/10 px-1.5 py-0.2 text-[10px] font-bold">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* VIEW MODE 1: Category-Wise Grouped View */}
            {viewMode === "grouped" && (
              <div className="space-y-6">
                {Object.entries(groupedResults)
                  .filter(([group]) => activeCategoryFilter === "all" || activeCategoryFilter === group)
                  .map(([catGroup, items]) => {
                    const CategoryIcon = getCategoryIcon(catGroup);
                    return (
                      <div key={catGroup} className="space-y-3">
                        {/* Category Header */}
                        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <CategoryIcon className="h-4 w-4" />
                            </div>
                            <h3 className="text-sm font-bold text-white tracking-tight">{catGroup}</h3>
                            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">
                              {items.length} {items.length === 1 ? "lead" : "leads"}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500">Verified {location} records</span>
                        </div>

                        {/* Category Grid */}
                        <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
                          {items.map(({ company: c, originalIndex: i }) => {
                            const isSelected = selectedIndices.has(i);
                            return (
                              <CompanyCard
                                key={i}
                                company={c}
                                index={i}
                                isSelected={isSelected}
                                copiedIndex={copiedIndex}
                                onSelect={() => toggleSelect(i)}
                                onCopy={(e) => copyLead(c, i, e)}
                                onClick={() => setActiveModalCompany(c)}
                                getBadgeStyle={getCategoryBadgeStyle}
                              />
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* VIEW MODE 2: Standard Grid View */}
            {viewMode === "grid" && (
              <div className="grid gap-3.5 md:grid-cols-2 lg:grid-cols-3">
                {filteredResults.map((c, i) => {
                  const isSelected = selectedIndices.has(i);
                  return (
                    <CompanyCard
                      key={i}
                      company={c}
                      index={i}
                      isSelected={isSelected}
                      copiedIndex={copiedIndex}
                      onSelect={() => toggleSelect(i)}
                      onCopy={(e) => copyLead(c, i, e)}
                      onClick={() => setActiveModalCompany(c)}
                      getBadgeStyle={getCategoryBadgeStyle}
                    />
                  );
                })}
              </div>
            )}

            {/* VIEW MODE 3: Enterprise Data Table */}
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
                      <th className="p-3.5">Industry Category</th>
                      <th className="p-3.5">Location & Street Address</th>
                      <th className="p-3.5">Contact Phone</th>
                      <th className="p-3.5">Official Website</th>
                      <th className="p-3.5">Google Rating</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredResults.map((c, i) => {
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
                                {c.reviewsCount != null && (
                                  <span className="text-[10px] text-slate-500">({c.reviewsCount})</span>
                                )}
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
              Try selecting another category or entering a major metropolitan city.
            </p>
          </div>
        )}
      </main>

      {/* Lead Inspector Modal */}
      {activeModalCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
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
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold uppercase border ${getCategoryBadgeStyle(activeModalCompany.category)}`}>
                    {activeModalCompany.category}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Group: {normalizeCategoryGroup(activeModalCompany.category)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-xs">
              <div className="rounded-xl bg-slate-900/60 p-3.5 border border-white/5 space-y-2.5">
                <div className="flex items-start gap-2.5 text-slate-300">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Verified Address</div>
                    <div className="mt-0.5 leading-relaxed">{activeModalCompany.address || activeModalCompany.location}</div>
                  </div>
                </div>

                {activeModalCompany.phone && (
                  <div className="flex items-start gap-2.5 text-slate-300 pt-2 border-t border-white/5">
                    <Phone className="h-4 w-4 text-teal-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Direct Phone</div>
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
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Official Website</div>
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
                    <span className="text-[11px] font-medium">{activeModalCompany.reviewsCount} Verified Reviews</span>
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
            <span>Category-Wise & Location-Accurate B2B Lead Platform</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <a href="https://github.com/jahirirfan-2005/company-finder" target="_blank" rel="noopener noreferrer" className="hover:text-white transition">
              GitHub
            </a>
            <span>•</span>
            <span>Real Geospatial Public Data</span>
            <span>•</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function CompanyCard({
  company: c,
  index: i,
  isSelected,
  copiedIndex,
  onSelect,
  onCopy,
  onClick,
  getBadgeStyle,
}: {
  company: Company;
  index: number;
  isSelected: boolean;
  copiedIndex: number | null;
  onSelect: () => void;
  onCopy: (e: React.MouseEvent) => void;
  onClick: () => void;
  getBadgeStyle: (cat: string) => string;
}) {
  return (
    <div
      onClick={onClick}
      className={`glass-panel group relative flex flex-col justify-between rounded-xl p-4 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:border-blue-500/50 ${
        isSelected ? "border-blue-500/60 bg-blue-950/20" : ""
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
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
                <span className={`mt-1.5 inline-block rounded-md px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase border ${getBadgeStyle(c.category)}`}>
                  {c.category}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onCopy}
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
              className="hover:underline hover:text-white font-mono text-[11px]"
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

      {/* Card Footer */}
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
            <span className="text-slate-500 text-[11px]">Verified Location</span>
          )}
        </div>

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
