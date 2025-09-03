// GET /api/entries?page=1&pageSize=50
import { type NextRequest, NextResponse } from "next/server";
import { readEntries } from "@/lib/google-sheets";
import { config } from "@/lib/config";
import { mockEntries } from "@/lib/mock-data";
import { cacheGet, cacheSet } from "@/lib/entries-cache";

// type CacheShape and TTL stay; CacheShape remains for type safety
type CacheShape = {
    entries: any[];
    total: number;
};
const TTL_MS = 30_000;

function isEnvReady() {
    return Boolean(
        config.google.spreadsheetId &&
            config.google.serviceAccountEmail &&
            config.google.serviceAccountPrivateKey,
    );
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = Number(searchParams.get("page") || "1");
        const pageSize = Number(
            searchParams.get("pageSize") || config.ui.pageSize || 50,
        );
        const force = searchParams.get("revalidate") === "true";

        let useMock = config.google.useMock || !isEnvReady();

        const cached = !force ? cacheGet<CacheShape>("entries") : null;
        if (cached) {
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const pageEntries = cached.entries.slice(start, end);
            return NextResponse.json({
                entries: pageEntries,
                total: cached.total,
                page,
                pageSize,
                totalPages: Math.max(1, Math.ceil(cached.total / pageSize)),
                cache: "HIT",
            });
        }

        let entries: any[] = [];
        let total = 0;

        if (useMock) {
            // Add rowNumber consistent with Sheets: header is row 1, data from row 2
            entries = mockEntries.map((e, idx) => ({
                ...e,
                rowNumber: idx + 2,
            }));
            total = entries.length;
        } else {
            try {
                const res = await readEntries();
                entries = res.entries;
                total = res.total;
            } catch (e) {
                if (config.google.useMock) {
                    entries = mockEntries.map((e, idx) => ({
                        ...e,
                        rowNumber: idx + 2,
                    }));
                    total = entries.length;
                    useMock = true;
                } else {
                    throw e;
                }
            }
        }

        cacheSet<CacheShape>("entries", { entries, total }, TTL_MS);

        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const pageEntries = entries.slice(start, end);

        return NextResponse.json({
            entries: pageEntries,
            total,
            page,
            pageSize,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
            cache: "MISS",
            source: useMock ? "mock" : "sheets",
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to load entries" },
            { status: 500 },
        );
    }
}
