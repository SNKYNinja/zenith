import { NextResponse } from "next/server";
import { cacheClear } from "@/lib/entries-cache";

export async function POST() {
    cacheClear("entries");
    return NextResponse.json({ ok: true, cleared: "entries" });
}
