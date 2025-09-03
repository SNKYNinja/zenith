// Centralized config and feature flags

export const config = {
    // Google Sheets settings
    google: {
        spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || "",
        // Use a named sheet like "Entries" and cover first 8 columns (A:H)
        range: process.env.GOOGLE_SHEETS_RANGE || "Entries!A:H",
        serviceAccountEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
        // Private key may contain literal \n when stored, normalize safely
        serviceAccountPrivateKey: (
            process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || ""
        ).replace(/\\n/g, "\n"),
        useMock: false,
    },

    // Global feature flags
    features: {
        // Keep the app working without Supabase. If you enable this, ensure envs are set.
        supabaseEnabled: process.env.SUPABASE_ENABLED === "true",
    },

    // UI & behavior
    ui: {
        pageSize: Number(process.env.NEXT_PUBLIC_PAGE_SIZE || 50),
    },
};

export type Entry = {
    registrationNumber: string;
    name: string;
    email: string;
    phoneNumber: string;
    residencyStatus: string; // "Hosteller" | "Day Scholar" | string
    uniqueId: string | null;
    transactionId: string;
    mailSent: boolean;
    // Internal fields
    rowNumber: number; // Google Sheets row index (1-based) to update precise rows
};
