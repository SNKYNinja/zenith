import { NextResponse } from "next/server";
import { cacheClear } from "@/lib/entries-cache";

export const dynamic = "force-dynamic";

export async function POST() {
    cacheClear("entries");
    return NextResponse.json(
        { ok: true, cleared: "entries" },
        {
            headers: { "Cache-Control": "no-store" },
        },
    );
}
