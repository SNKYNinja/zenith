// POST /api/entries/generate-ids
// Generates Unique IDs for entries that are missing them and writes back to Google Sheets.
import { NextResponse } from "next/server";
import { writeUniqueIdsForMissing } from "@/lib/google-sheets";

export async function POST() {
    try {
        const { updatedCount } = await writeUniqueIdsForMissing();
        return NextResponse.json({ updatedCount });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Failed to generate Unique IDs" },
            { status: 500 },
        );
    }
}
