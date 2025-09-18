"use server";

import { config, type Entry } from "@/lib/config";
import { mapHeaders } from "@/lib/utils";
import { google } from "googleapis";

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
                email: get("email address"),
                phoneNumber: get("contact number"),
                residencyStatus:
                    get("hosteller/day scholar") ||
                    get("hosteller/Day Scholar".toLowerCase()) ||
                    get("hosteller/day scholar"),
                uniqueId: (get("unique id") || null) as string | null,
                transactionId: get("utr number"),
                desk: get("desk"),
                mailSent,
                rowNumber: idx + 2, // +2 because headers are row 1, data starts at row 2
            };
        });

        return { entries, total: entries.length };
    } catch (err) {
        console.log(err);
        return { entries: [], total: 0 };
    }
}

export async function updateMailSentStatus(rowNumber: number, value: boolean) {
    const { sheets } = getSheetsClient();

    await sheets.spreadsheets.values.update({
        spreadsheetId: config.google.spreadsheetId!,
        range: `Boys!A${rowNumber}`, // adjust to your "Mail Sent Status" column
        valueInputOption: "RAW",
        requestBody: { values: [[value]] },
    });
}
