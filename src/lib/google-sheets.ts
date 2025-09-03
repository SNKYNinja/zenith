// Helper to read and write entries from Google Sheets using googleapis
import { google } from "googleapis";
import { config, type Entry } from "./config";
import { customAlphabet } from "nanoid/non-secure";

// Unique ID generator: short, collision-resistant, prefixed
const nano = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);
export function generateUniqueId() {
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

type HeadersMap = {
    [key: string]: number;
};

function mapHeaders(headers: string[]): HeadersMap {
    const map: HeadersMap = {};
    headers.forEach((h, i) => {
        map[h.trim().toLowerCase()] = i;
    });
    return map;
}

function toA1(colIndex: number, rowIndex: number) {
    // colIndex: 0-based -> 'A', 'B', ...
    const chars: string[] = [];
    let n = colIndex + 1;
    while (n > 0) {
        const rem = (n - 1) % 26;
        chars.push(String.fromCharCode(65 + rem));
        n = Math.floor((n - 1) / 26);
    }
    return `${chars.reverse().join("")}${rowIndex}`;
}

export async function readEntries(): Promise<{
    entries: Entry[];
    total: number;
}> {
    try {
        const { sheets } = getSheetsClient();
        const { spreadsheetId, range } = config.google;

        const res = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });

        const values = res.data.values || [];
        if (values.length === 0) {
            return { entries: [], total: 0 };
        }

        const headers = values[0].map((h) => (h || "").toString().trim());
        const map = mapHeaders(headers);

        // Expected headers (case-insensitive match):
        // Registration Number, Name, Email, Phone Number, Hosteller/Day Scholar, Unique ID, Transaction ID, Mail Sent Status
        const dataRows = values.slice(1);
        const entries: Entry[] = dataRows.map((row, idx) => {
            const get = (key: string) => {
                const i = map[key];
                return i !== undefined ? (row[i] || "").toString().trim() : "";
            };

            const mailSentRaw = get("sent").toLowerCase();
            const mailSent =
                mailSentRaw === "true" ||
                mailSentRaw === "1" ||
                mailSentRaw === "yes";

            return {
                registrationNumber: get("registration number"),
                name: get("name"),
                email: get("email"),
                phoneNumber: get("phone number"),
                residencyStatus:
                    get("hosteller/day scholar") ||
                    get("hosteller/Day Scholar".toLowerCase()) ||
                    get("hosteller/day scholar"),
                uniqueId: (get("unique id") || null) as string | null,
                transactionId: get("transaction id"),
                mailSent,
                rowNumber: idx + 2, // +2 because headers are row 1, data starts at row 2
            };
        });

        return { entries, total: entries.length };
    } catch (err) {
        console.log(err);
        return;
    }
}

export async function writeUniqueIdsForMissing(): Promise<{
    updatedCount: number;
}> {
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
            throw new Error("The sheet must contain a 'Unique ID' column.");
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
    } catch (err) {
        console.log(err);
        return;
    }
}
