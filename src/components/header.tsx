"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/refresh-button";
import { generateUniqueIds } from "@/actions/id";
import { Loader2 } from "lucide-react";
import { sendEmail } from "@/actions/email";

export function HeaderBar() {
    const [testMode, setTestMode] = useState(false);

    const [idsPending, startIdsTransition] = useTransition();
    const [ticketsPending, startTicketsTransition] = useTransition();
    const [emailsPending, startEmailTransition] = useTransition();

    useEffect(() => {
        const saved = localStorage.getItem("et_test_mode");
        if (saved) setTestMode(saved === "true");
    }, []);

    useEffect(() => {
        localStorage.setItem("et_test_mode", String(testMode));
    }, [testMode]);

    function handleGenerateIds() {
        startIdsTransition(async () => {
            try {
                const result = await generateUniqueIds();

                if (result.error) throw new Error(result.error);

                toast.success(
                    `Generated Unique IDs for ${result.updatedCount} entries`,
                );

                window.dispatchEvent(new CustomEvent("entries:refresh"));
            } catch (e: any) {
                toast.error(
                    e?.message || "Something went wrong while generating IDs",
                );
            }
        });
    }

    function handleGenerateTickets() {
        startTicketsTransition(async () => {
            try {
                let response = await fetch("/api/generate-qr", {
                    method: "GET",
                });
                if (!response.ok)
                    throw new Error("Failed to generate QR codes");

                response = await fetch("/api/generate-ticket", {
                    method: "GET",
                });

                if (!response.ok) throw new Error("Failed to generate tickets");

                const data = await response.json();

                toast.success(`${data.generated} tickets created!`);
            } catch (e: any) {
                toast.error(
                    e?.message ||
                        "Something went wrong while generating tickets",
                );
            }
        });
    }

    function handleEmail() {
        startEmailTransition(async () => {
            try {
                await sendEmail(100);
                toast.success("Emails sent successfully!");
            } catch (err) {
                console.error(err);
                toast.error("Something unexpected happenend!");
            }
        });
    }

    return (
        <Card className="p-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-lg font-semibold text-balance">
                        Zenith
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Manage entries from Google Sheets. Only essential fields
                        and actions are shown.
                    </p>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-2">
                        <Switch
                            id="test-mode"
                            checked={testMode}
                            onCheckedChange={(checked) => {
                                setTestMode(checked);
                                if (checked) {
                                    toast.info("Test Mode enabled");
                                } else {
                                    toast.warning("Test Mode disabled");
                                }
                            }}
                        />
                        <label htmlFor="test-mode" className="text-sm">
                            Test Mode
                        </label>
                    </div>
                    <RefreshButton />
                    <Button
                        variant="destructive"
                        onClick={handleEmail}
                        disabled={emailsPending}
                    >
                        {emailsPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {emailsPending ? "Sending…" : "Send Mails"}
                    </Button>
                    <Button
                        onClick={handleGenerateTickets}
                        variant="outline"
                        disabled={ticketsPending}
                    >
                        {ticketsPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {ticketsPending ? "Generating…" : "Generate Tickets"}
                    </Button>
                    <Button onClick={handleGenerateIds} disabled={idsPending}>
                        {idsPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {idsPending ? "Generating…" : "Generate Unique IDs"}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
