import { NextResponse } from "next/server";
import { generateTicket } from "@/lib/generate";

export async function GET() {
    const result = await generateTicket();
    return NextResponse.json(result);
}
