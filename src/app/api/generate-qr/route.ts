import { NextResponse } from "next/server";
import { generateQrFiles } from "@/lib/generate";

export async function GET() {
    const result = await generateQrFiles();
    return NextResponse.json(result);
}
