import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Loader2,
  MapPin,
  Building2,
  Search,
  Sparkles,
  Globe,
  Phone,
  Star,
  FileSpreadsheet,
  FileText,
  ArrowRight,
} from "lucide-react";
import { searchCompanies, type Company } from "@/lib/search-companies.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Company Finder — Search companies by location & category" },
      {
        name: "description",
        content:
          "Search companies on Google Maps by location and category (IT, Non-IT, more). Export results to CSV or Excel.",
      },
      { property: "og:title", content: "Company Finder" },
      { property: "og:description", content: "Find companies by location and category. Export to CSV/Excel." },
    ],
  }),
  component: Index,
});

function ErrorBoundary({ error }: { error: Error }) {
  const router = useRouter();
  return (
    <div className="p-8 text-center">
      <p className="text-destructive">{error.message}</p>
      <Button onClick={() => router.invalidate()} className="mt-4">
        Retry
      </Button>
    </div>
  );
}
Route.options.errorComponent = ErrorBoundary;

function Index() {
  const run = useServerFn(searchCompanies);
  const [location, setLocation] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [results, setResults] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!location.trim() && !companyType.trim()) {
      setError("Enter a location, a company type, or both.");
      return;
    }
    setLoading(true);
    setSearched(true);
    try {
      const data = await run({ data: { location, companyType } });
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function downloadCSV() {
    const ws = XLSX.utils.json_to_sheet(results);
    const csv = XLSX.utils.sheet_to_csv(ws);
    triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "companies.csv");
  }

  function downloadXLSX() {
    const ws = XLSX.utils.json_to_sheet(results);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Companies");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    triggerDownload(
      new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      "companies.xlsx",
    );
  }

  const withWebsite = results.filter((c) => c.website).length;
  const withPhone = results.filter((c) => c.phone).length;

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <div className="hero-glow pointer-events-none absolute inset-x-0 top-0 h-[70vh]" />

      <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-16 md:pt-24">
        {/* Hero */}
        <header className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <Sparkles className="h-3.5 w-3.5 text-mint" />
            Google Maps company intelligence
          </span>
          <h1 className="mt-6 text-4xl leading-[1.15] font-bold tracking-tight text-balance sm:text-5xl md:text-6xl">
            Find every company,
            <br />
            <span className="inline-block bg-gradient-to-r from-primary to-mint bg-clip-text pb-1 text-transparent">
              city by city.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground md:text-lg">
            Search by location, by category, or both — then export a clean lead list to CSV or Excel in one click.
          </p>

        </header>

        {/* Search */}
        <Card className="glass-card mx-auto mt-10 max-w-4xl rounded-3xl p-2 shadow-[var(--shadow-glow)]">
          <CardContent className="p-4 md:p-5">
            <form onSubmit={handleSearch} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
              <div className="relative">
                <MapPin className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-mint" />
                <Input
                  className="h-12 rounded-xl border-border bg-background/60 pl-10 text-base"
                  placeholder="Location — Bangalore, New York…"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>
              <div className="relative">
                <Building2 className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-primary" />
                <Input
                  className="h-12 rounded-xl border-border bg-background/60 pl-10 text-base"
                  placeholder="Company type — IT, Non-IT, Marketing…"
                  value={companyType}
                  onChange={(e) => setCompanyType(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="h-12 rounded-xl px-7 text-base font-semibold transition-transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" /> Search
                  </>
                )}
              </Button>
            </form>
            {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
            <p className="mt-3 text-xs text-muted-foreground">
              Fill one or both fields. Live scraping usually takes 30–90 seconds.
            </p>
          </CardContent>
        </Card>

        {/* Suggestions */}
        {!searched && !loading && (
          <div className="mx-auto mt-10 grid max-w-4xl gap-4 md:grid-cols-3">
            {[
              { type: "IT", loc: "Bangalore" },
              { type: "Marketing", loc: "New York" },
              { type: "Manufacturing", loc: "Chennai" },
            ].map((s) => (
              <button
                key={s.type}
                onClick={() => {
                  setCompanyType(s.type);
                  setLocation(s.loc);
                }}
                className="group glass-card rounded-2xl p-5 text-left transition-all hover:-translate-y-1 hover:border-primary/60"
              >
                <div className="text-xs tracking-widest text-muted-foreground uppercase">Try a search</div>
                <div className="mt-2 flex items-center justify-between gap-3 font-display text-base font-semibold">
                  <span>
                    {s.type} companies in {s.loc}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-1" />
                </div>
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="mt-16 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
              <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">Scanning Google Maps… this may take up to a minute.</p>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <section className="mt-14">
            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              <Stat label="Companies found" value={results.length} />
              <Stat label="With website" value={withWebsite} />
              <Stat label="With phone" value={withPhone} />
            </div>

            <Card className="glass-card overflow-hidden rounded-3xl">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
                <h2 className="text-lg font-semibold">Results</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="rounded-lg" onClick={downloadCSV}>
                    <FileText className="mr-2 h-4 w-4" /> CSV
                  </Button>
                  <Button size="sm" className="rounded-lg" onClick={downloadXLSX}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel
                  </Button>
                </div>
              </div>
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6 text-xs tracking-wider uppercase">Company</TableHead>
                      <TableHead className="text-xs tracking-wider uppercase">Category</TableHead>
                      <TableHead className="text-xs tracking-wider uppercase">Location</TableHead>
                      <TableHead className="text-xs tracking-wider uppercase">Contact</TableHead>
                      <TableHead className="pr-6 text-xs tracking-wider uppercase">Rating</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((c, i) => (
                      <TableRow key={i} className="border-border/60 transition-colors hover:bg-accent/40">
                        <TableCell className="pl-6 font-medium">
                          <div>{c.name}</div>
                          {c.website && (
                            <a
                              href={c.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-1 inline-flex items-center gap-1 text-xs text-mint hover:underline"
                            >
                              <Globe className="h-3 w-3" />
                              {c.website.replace(/^https?:\/\//, "").slice(0, 36)}
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          {c.category && (
                            <Badge variant="secondary" className="rounded-full font-normal">
                              {c.category}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{c.location}</div>
                          <div className="text-xs text-muted-foreground">{c.address}</div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {c.phone ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              {c.phone}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="pr-6 text-sm">
                          {c.rating != null ? (
                            <span className="inline-flex items-center gap-1.5">
                              <Star className="h-3.5 w-3.5 fill-mint text-mint" />
                              {c.rating}
                              <span className="text-xs text-muted-foreground">({c.reviewsCount ?? 0})</span>
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </section>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <div className="glass-card mt-14 rounded-3xl p-14 text-center text-muted-foreground">
            No companies found. Try a different city or category.
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass-card rounded-2xl px-5 py-4">
      <div className="font-display text-3xl font-bold text-foreground">{value}</div>
      <div className="mt-1 text-xs tracking-wider text-muted-foreground uppercase">{label}</div>
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
