"use client";

import { Card } from "@/components/ui/card";

type Feature = { title: string; detail?: string };

const added: Feature[] = [
    { title: "Dashboard layout with shadcn/ui" },
    { title: "Google Sheets read (Entries API)" },
    { title: "Required fields table (8 columns)" },
    { title: "Pagination with SWR" },
    { title: "Unique ID generation endpoint (Google Sheets write)" },
    {
        title: "Write Unique IDs back to sheet (wired)",
        detail: "Batch update implemented",
    },
    { title: "Test Mode toggle (client-side state)" },
    { title: "Supabase integration flag (disabled by default)" },
];

const inProgress: Feature[] = [
    {
        title: "Snappiness: cache + skeletons",
        detail: "API TTL cache, skeleton rows, client keepPreviousData",
    },
];

const planned: Feature[] = [
    { title: "E-ticket generation with Jimp" },
    { title: "Nodemailer Gmail SMTP sending (batch, resume)" },
    { title: "Idempotency: mark sent in Sheets and Supabase" },
    { title: "Logs: capture success/failure with export" },
    { title: "Retry failed and batching/pause by quota" },
    { title: "Optional Supabase mirror (toggle via flag)" },
    { title: "Desk Number overlay (optional) in ticket" },
    { title: "Performance: virtualization for 4k+ rows" },
    { title: "Testing Mode: preview tickets, send tests only" },
];

export function FeatureTracker() {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="p-4">
                <h3 className="text-sm font-medium mb-2">Added</h3>
                <ul className="list-disc pl-5 space-y-1">
                    {added.map((f, i) => (
                        <li
                            key={`a-${i}`}
                            className="text-sm text-muted-foreground"
                        >
                            <span className="text-foreground">{f.title}</span>
                            {f.detail ? (
                                <span className="text-muted-foreground">
                                    {" "}
                                    — {f.detail}
                                </span>
                            ) : null}
                        </li>
                    ))}
                </ul>
            </Card>
            <Card className="p-4">
                <h3 className="text-sm font-medium mb-2">In Progress</h3>
                <ul className="list-disc pl-5 space-y-1">
                    {inProgress.map((f, i) => (
                        <li
                            key={`i-${i}`}
                            className="text-sm text-muted-foreground"
                        >
                            <span className="text-foreground">{f.title}</span>
                            {f.detail ? (
                                <span className="text-muted-foreground">
                                    {" "}
                                    — {f.detail}
                                </span>
                            ) : null}
                        </li>
                    ))}
                </ul>
            </Card>
            <Card className="p-4">
                <h3 className="text-sm font-medium mb-2">Planned</h3>
                <ul className="list-disc pl-5 space-y-1">
                    {planned.map((f, i) => (
                        <li
                            key={`p-${i}`}
                            className="text-sm text-muted-foreground"
                        >
                            <span className="text-foreground">{f.title}</span>
                            {f.detail ? (
                                <span className="text-muted-foreground">
                                    {" "}
                                    — {f.detail}
                                </span>
                            ) : null}
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
}
