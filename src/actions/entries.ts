"use server";

import { readEntries } from "@/actions/sheet";
import { config } from "@/lib/config";
import { mockEntries } from "@/lib/mock-data";
import { cacheGet, cacheSet } from "@/actions/cache";

type CacheShape = {
    entries: any[];
    total: number;
};

type GetEntriesParams = {
    page?: number;
    pageSize?: number;
    revalidate?: boolean;
};

type GetEntriesResult = {
    entries: any[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    cache: "HIT" | "MISS";
    source?: "mock" | "sheets";
    error?: string;
};

const TTL_MS = 30_000;

function isEnvReady() {
    return Boolean(
        config.google.spreadsheetId &&
            config.google.serviceAccountEmail &&
            config.google.serviceAccountPrivateKey,
    );
}

export async function getEntries(
    params: GetEntriesParams = {},
): Promise<GetEntriesResult> {
    try {
        const page = params.page || 1;
        const pageSize = params.pageSize || config.ui.pageSize || 50;
        const force = params.revalidate === true;

        let useMock = config.google.useMock || !isEnvReady();

        const cached = !force ? cacheGet<CacheShape>("entries") : null;
        if (cached) {
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const pageEntries = cached.entries.slice(start, end);

            return {
                entries: pageEntries,
                total: cached.total,
                page,
                pageSize,
                totalPages: Math.max(1, Math.ceil(cached.total / pageSize)),
                cache: "HIT",
            };
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

        return {
            entries: pageEntries,
            total,
            page,
            pageSize,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
            cache: "MISS",
            source: useMock ? "mock" : "sheets",
        };
    } catch (error: any) {
        return {
            entries: [],
            total: 0,
            page: params.page || 1,
            pageSize: params.pageSize || config.ui.pageSize || 50,
            totalPages: 0,
            cache: "MISS",
            error: error.message || "Failed to load entries",
        };
    }
}
