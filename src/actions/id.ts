"use server";

import { config } from "@/lib/config";
import { customAlphabet } from "nanoid/non-secure";
import { mapHeaders, toA1 } from "@/lib/utils";
import { google } from "googleapis";

// Unique ID generator: short, collision-resistant, prefixed
const nano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

function generateUniqueId() {
    return `ET-${nano()}`;
}

function getSheetsClient() {
    if (
        !config.google.spreadsheetId ||
        !config.google.serviceAccountEmail ||
        !config.google.serviceAccountPrivateKey
    ) {
        throw new Error(
            "Missing Google Sheets environment variables. Please set GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.",
        );
    }

    const auth = new google.auth.JWT({
        email: config.google.serviceAccountEmail,
        key: config.google.serviceAccountPrivateKey,
        scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    return { sheets };
}

type GenerateIdsResult = {
    updatedCount: number;
    error?: string;
};

export async function generateUniqueIds(): Promise<GenerateIdsResult> {
    try {
        const { sheets } = getSheetsClient();
        const { spreadsheetId, range } = config.google;

        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const values = res.data.values || [];
        if (values.length === 0) {
            return { updatedCount: 0 };
        }

        const headers = values[0].map((h) => (h || "").toString().trim());
        const map = mapHeaders(headers);

        const uniqueIdColIndex = map["unique id"];
        if (uniqueIdColIndex === undefined) {
            return {
                updatedCount: 0,
                error: "The sheet must contain a 'Unique ID' column.",
            };
        }

        // Build batch updates for rows missing Unique ID
        const dataRows = values.slice(1);
        const dataUpdates: { range: string; values: string[][] }[] = [];

        dataRows.forEach((row, idx) => {
            const current = (row[uniqueIdColIndex] || "").toString().trim();
            if (!current) {
                const a1 = toA1(uniqueIdColIndex, idx + 2); // rowNumber = idx + 2
                dataUpdates.push({
                    range: `${range.split("!")[0]}!${a1}:${a1}`,
                    values: [[generateUniqueId()]],
                });
            }
        });

        if (dataUpdates.length === 0) {
            return { updatedCount: 0 };
        }

        await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId,
            requestBody: {
                valueInputOption: "RAW",
                data: dataUpdates,
            },
        });

        return { updatedCount: dataUpdates.length };
    } catch (error: any) {
        console.error("Error generating unique IDs:", error);
        return {
            updatedCount: 0,
            error: error.message || "Failed to generate Unique IDs",
        };
    }
}
