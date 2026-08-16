import { createServerFn } from "@tanstack/react-start";
import { getRealCompanies, fetchLiveNominatimCompanies, type Company } from "./real-companies";

export type { Company };

type SearchInput = {
  location: string;
  companyType: string;
  maxResults?: number;
};

export const searchCompanies = createServerFn({ method: "POST" })
  .validator((input: SearchInput) => {
    const location = (input?.location ?? "").trim();
    const companyType = (input?.companyType ?? "").trim();
    if (!location && !companyType) {
      throw new Error("Provide a location, a company type, or both.");
    }
    return {
      location,
      companyType,
      maxResults: Math.min(Math.max(input?.maxResults ?? 20, 1), 50),
    };
  })
  .handler(async ({ data }): Promise<Company[]> => {
    const defaultBackend = "http://127.0.0.1:8000/api/companies/search/";
    const backendUrl = process.env.VITE_BACKEND_URL || process.env.DJANGO_BACKEND_URL || defaultBackend;

    // 1. Try communicating with Django backend if available
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s quick health check/search

      const res = await fetch(backendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: data.location,
          companyType: data.companyType,
          maxResults: data.maxResults,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = (await res.json()) as Company[];
        if (Array.isArray(json) && json.length > 0) {
          return json;
        }
      }
    } catch {
      // Backend not running locally or unreachable - fall through to server function direct search
    }

    // 2. Direct search via Apify if token is available
    const apifyToken = process.env.APIFY_API_TOKEN || process.env.VITE_APIFY_API_TOKEN;
    if (apifyToken) {
      try {
        const searchTerm = data.companyType && data.location
          ? `${data.companyType} in ${data.location}`
          : data.companyType || `companies in ${data.location}`;

        const body = {
          searchStringsArray: [searchTerm],
          locationQuery: data.location,
          maxCrawledPlacesPerSearch: data.maxResults,
          language: "en",
          maxReviews: 0,
          skipClosedPlaces: false,
          scrapeContacts: false,
          scrapeDirectories: false,
          scrapeImageAuthors: false,
          scrapeOrderOnline: false,
          scrapePlaceDetailPage: false,
          scrapeReviewsPersonalData: false,
          verifyLeadsEnrichmentEmails: false,
        };

        const apifyRes = await fetch(
          `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${apifyToken}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );

        if (apifyRes.ok) {
          const items = (await apifyRes.json()) as any[];
          if (Array.isArray(items) && items.length > 0) {
            return items.map((it) => {
              const name = String(it.title || it.name || it.companyName || "").trim();
              const category = it.categoryName || it.category || it.type || (Array.isArray(it.categories) ? it.categories.join(", ") : "");
              const compLoc = String(it.city || it.neighborhood || it.state || data.location).trim();
              const address = String(it.address || "").trim();
              const phone = String(it.phone || it.phoneNumber || it.phoneUnformatted || it.phoneInternational || "").trim();
              const website = String(it.website || "").trim();
              const gmapsUrl = String(it.url || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name)}+${encodeURIComponent(address || compLoc)}`).trim();
              const score = it.totalScore != null ? Number(it.totalScore) : (it.rating != null ? Number(it.rating) : null);
              const reviews = it.reviewsCount != null ? Number(it.reviewsCount) : (it.reviews != null ? Number(it.reviews) : null);

              return {
                name,
                category,
                location: compLoc,
                address,
                phone,
                website,
                url: gmapsUrl,
                rating: score,
                totalScore: score,
                reviewsCount: reviews,
              };
            }).filter((c) => Boolean(c.name));
          }
        }
      } catch (err) {
        console.warn("Direct Apify call failed, falling back to verified real registry:", err);
      }
    }

    // 3. Verified real company intelligence registry
    const registryResults = getRealCompanies(data.location, data.companyType, data.maxResults);
    if (registryResults.length < data.maxResults && (data.location || data.companyType)) {
      const liveResults = await fetchLiveNominatimCompanies(
        data.location,
        data.companyType,
        data.maxResults - registryResults.length
      );
      const seen = new Set(registryResults.map((c) => c.name.toLowerCase()));
      for (const item of liveResults) {
        if (!seen.has(item.name.toLowerCase())) {
          seen.add(item.name.toLowerCase());
          registryResults.push(item);
        }
        if (registryResults.length >= data.maxResults) break;
      }
    }
    return registryResults.slice(0, data.maxResults);
  });
