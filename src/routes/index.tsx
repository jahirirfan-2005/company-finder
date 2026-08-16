import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  MapPin,
  Building2,
  Search,
  Download,
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
} from "lucide-react";
import { searchCompanies, type Company } from "@/lib/search-companies.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Company Scout — Google Maps Company Intelligence" },
      {
        name: "description",
        content:
          "Find every company, city by city. Search by location, category, or both. Export clean lead lists to CSV or Excel in one click.",
      },
      { property: "og:title", content: "Company Scout — Google Maps Company Intelligence" },
      {
        property: "og:description",
        content: "Search companies by location & category. Export clean lead lists to CSV or Excel.",
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
        <h2 className="text-xl font-semibold text-foreground">Search Error</h2>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={() => router.invalidate()} className="glow-btn mt-6 w-full">
          Try Again
        </Button>
      </div>
    </div>
  );
}
Route.options.errorComponent = ErrorBoundary;

function Index() {
  const run = useServerFn(searchCompanies);
  const [location, setLocation] = useState("chennai");
  const [companyType, setCompanyType] = useState("IT");
  const [results, setResults] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const quickSearches = [
    { loc: "Chennai", type: "IT" },
    { loc: "Bangalore", type: "Software" },
    { loc: "Mumbai", type: "FinTech" },
    { loc: "Hyderabad", type: "Cloud Services" },
    { loc: "New York", type: "Marketing" },
  ];

  async function handleSearch(e?: React.FormEvent, customLoc?: string, customType?: string) {
    if (e) e.preventDefault();
    const targetLoc = (customLoc !== undefined ? customLoc : location).trim();
    const targetType = (customType !== undefined ? customType : companyType).trim();

    setError(null);
    if (!targetLoc && !targetType) {
      setError("Please provide a location, a company type, or both.");
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const data = await run({
        data: {
          location: targetLoc,
          companyType: targetType,
          maxResults: 25,
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

  const filteredResults = useMemo(() => {
    if (!filterText.trim()) return results;
    const query = filterText.toLowerCase();
    return results.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.category.toLowerCase().includes(query) ||
        c.address.toLowerCase().includes(query) ||
        c.location.toLowerCase().includes(query),
    );
  }, [results, filterText]);

  function copyLead(c: Company, idx: number) {
    const text = `${c.name}\nCategory: ${c.category}\nLocation: ${c.location}\nAddress: ${c.address}\nPhone: ${c.phone || "N/A"}\nWebsite: ${c.website || "N/A"}\nRating: ${c.rating ?? "N/A"} (${c.reviewsCount ?? 0} reviews)\nGoogle Maps: ${c.url}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function downloadCSV() {
    const ws = XLSX.utils.json_to_sheet(
      results.map((c) => ({
        Name: c.name,
        Category: c.category,
        Location: c.location,
        Address: c.address,
        Phone: c.phone,
        Website: c.website,
        Rating: c.rating,
        Reviews: c.reviewsCount,
        GoogleMapsUrl: c.url,
      })),
    );
    const csv = XLSX.utils.sheet_to_csv(ws);
    triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `companies-${location || "leads"}.csv`);
  }

  function downloadXLSX() {
    const ws = XLSX.utils.json_to_sheet(
      results.map((c) => ({
        Name: c.name,
        Category: c.category,
        Location: c.location,
        Address: c.address,
        Phone: c.phone,
        Website: c.website,
        Rating: c.rating,
        Reviews: c.reviewsCount,
        GoogleMapsUrl: c.url,
      })),
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Companies");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    triggerDownload(
      new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `companies-${location || "leads"}.xlsx`,
    );
  }

  return (
    <div className="relative min-h-screen bg-[#090d16] text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Ambient background glows */}
      <div className="ambient-glow -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[700px] bg-blue-600/20" />
      <div className="ambient-glow top-[30%] -left-40 h-[400px] w-[500px] bg-indigo-600/15" />
      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header Badge */}
        <div className="flex justify-center">
          <div className="glow-pill inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-400">
            <Sparkles className="h-3.5 w-3.5 text-teal-400" />
            <span>Google Maps Company Intelligence</span>
          </div>
        </div>

        {/* Hero Headline */}
        <header className="mt-8 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            <span className="gradient-title block">Find every company,</span>
            <span className="gradient-accent-text block">city by city.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
            Search by location, by category, or both — then export a clean lead list to CSV or Excel in one click.
          </p>
        </header>

        {/* Search Bar Container */}
        <div className="glass-panel mx-auto mt-12 max-w-4xl rounded-2xl p-4 sm:p-6 shadow-2xl">
          <form onSubmit={(e) => handleSearch(e)} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            {/* Location Input */}
            <div className="relative flex items-center">
              <MapPin className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or region (e.g. Chennai, Bangalore)"
                className="glass-input h-12 w-full rounded-xl pl-10 pr-4 text-sm outline-none placeholder:text-slate-500"
              />
            </div>

            {/* Category Input */}
            <div className="relative flex items-center">
              <Building2 className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={companyType}
                onChange={(e) => setCompanyType(e.target.value)}
                placeholder="Company type (e.g. IT, Marketing, Hospital)"
                className="glass-input h-12 w-full rounded-xl pl-10 pr-4 text-sm outline-none placeholder:text-slate-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="glow-btn flex h-12 items-center justify-center gap-2 rounded-xl px-7 text-sm font-semibold text-white transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching…</span>
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  <span>Search</span>
                </>
              )}
            </button>
          </form>

          {/* Inline Error */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-950/40 p-3 text-sm text-red-400 border border-red-800/50">
              <span>{error}</span>
            </div>
          )}

          {/* Subtext info */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>Fill one or both fields. Live scraping usually takes 30–90 seconds.</span>
            <div className="flex items-center gap-1.5 text-slate-500">
              <CheckCircle2 className="h-3.5 w-3.5 text-teal-400" />
              <span>Full contact & verified Maps links</span>
            </div>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        {!searched && !loading && (
          <div className="mx-auto mt-8 max-w-4xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Popular Searches</p>
            <div className="flex flex-wrap gap-2">
              {quickSearches.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setLocation(item.loc);
                    setCompanyType(item.type);
                    handleSearch(undefined, item.loc, item.type);
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3.5 py-2 text-xs font-medium text-slate-300 transition hover:border-blue-500/50 hover:bg-slate-800 hover:text-white"
                >
                  <MapPin className="h-3 w-3 text-blue-400" />
                  <span>{item.type} in {item.loc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="glass-panel mx-auto mt-12 flex max-w-2xl flex-col items-center justify-center gap-4 rounded-2xl p-12 text-center shadow-2xl">
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div className="absolute h-full w-full animate-ping rounded-full bg-blue-500/20" />
              <div className="h-12 w-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Scraping Google Maps Intelligence</h3>
              <p className="mt-1 text-sm text-slate-400">
                Aggregating business leads, verified phone numbers, websites, and review metrics for {location || "all regions"}...
              </p>
            </div>
          </div>
        )}

        {/* Search Results */}
        {!loading && results.length > 0 && (
          <div className="mt-12 space-y-6">
            {/* Action Bar */}
            <div className="glass-panel flex flex-col gap-4 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Found {results.length} Leads
                </h2>
                <p className="text-xs text-slate-400">
                  Targeted results for <span className="text-blue-400 font-medium">{companyType || "all categories"}</span> in{" "}
                  <span className="text-teal-400 font-medium">{location || "global"}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="text"
                  placeholder="Filter results..."
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  className="glass-input h-9 rounded-lg px-3 text-xs outline-none placeholder:text-slate-500 w-36 sm:w-44"
                />

                <Button
                  onClick={downloadCSV}
                  variant="outline"
                  size="sm"
                  className="h-9 border-slate-700 bg-slate-800/80 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  <FileText className="mr-1.5 h-3.5 w-3.5 text-blue-400" />
                  CSV
                </Button>

                <Button
                  onClick={downloadXLSX}
                  variant="outline"
                  size="sm"
                  className="h-9 border-slate-700 bg-slate-800/80 text-xs font-medium text-slate-200 hover:bg-slate-700 hover:text-white"
                >
                  <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 text-teal-400" />
                  Excel
                </Button>
              </div>
            </div>

            {/* Results Grid / Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredResults.map((c, i) => (
                <div
                  key={i}
                  className="glass-panel group relative flex flex-col justify-between rounded-xl p-5 transition-all duration-200 hover:-translate-y-1 hover:border-blue-500/40"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                          {c.name}
                        </h3>
                        {c.category && (
                          <span className="mt-1 inline-block rounded bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-400 border border-blue-500/20">
                            {c.category}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => copyLead(c, i)}
                        title="Copy lead info"
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-800 hover:text-white"
                      >
                        {copiedIndex === i ? (
                          <Check className="h-4 w-4 text-teal-400" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>

                    {/* Address */}
                    <div className="mt-3.5 flex items-start gap-2 text-xs text-slate-400">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
                      <span className="line-clamp-2">{c.address || c.location}</span>
                    </div>

                    {/* Phone */}
                    {c.phone && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-300">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-teal-400" />
                        <a href={`tel:${c.phone}`} className="hover:underline hover:text-white">
                          {c.phone}
                        </a>
                      </div>
                    )}

                    {/* Website */}
                    {c.website && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-blue-400">
                        <Globe className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                        <a
                          href={c.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:underline"
                        >
                          {c.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Rating & Maps link */}
                  <div className="mt-5 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      {c.rating != null ? (
                        <>
                          <div className="flex items-center text-amber-400">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="ml-1 font-semibold text-slate-200">{c.rating}</span>
                          </div>
                          {c.reviewsCount != null && (
                            <span className="text-slate-500">({c.reviewsCount})</span>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-500">Unrated</span>
                      )}
                    </div>

                    <a
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      <span>Maps</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && searched && results.length === 0 && !error && (
          <div className="glass-panel mx-auto mt-12 max-w-lg rounded-2xl p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-slate-600" />
            <h3 className="mt-4 text-base font-semibold text-white">No companies found</h3>
            <p className="mt-1 text-sm text-slate-400">
              Try adjusting your search criteria or searching for broader terms.
            </p>
          </div>
        )}
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
export default Index;
