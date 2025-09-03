"use client";

import { useEffect, useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { RefreshButton } from "@/components/refresh-button";

export function HeaderBar() {
    const [testMode, setTestMode] = useState(false);
    const [generating, setGenerating] = useState(false);
    const { mutate } = useSWRConfig();

    useEffect(() => {
        const saved = localStorage.getItem("et_test_mode");
        if (saved) setTestMode(saved === "true");
    }, []);

    useEffect(() => {
        localStorage.setItem("et_test_mode", String(testMode));
    }, [testMode]);

    async function handleGenerateIds() {
        setGenerating(true);
        try {
            const res = await fetch("/api/entries/generate-ids", {
                method: "POST",
            });
            const json = await res.json();
            if (!res.ok)
                throw new Error(json.error || "Failed to generate Unique IDs");

            toast.success(
                `Generated Unique IDs for ${json.updatedCount ?? 0} entries`,
            );

            await fetch("/api/entries/refresh", { method: "POST" });
            await mutate(
                (key) =>
                    typeof key === "string" && key.startsWith("/api/entries"),
                undefined,
                { revalidate: true },
            );

            window.dispatchEvent(new CustomEvent("entries:refresh"));
        } catch (e: any) {
            toast.error(
                e?.message || "Something went wrong while generating IDs",
            );
        } finally {
            setGenerating(false);
        }
    }

    function handleGenerateTickets() {
        // Simple placeholder until fresh implementation is added
        toast.info("Generate Tickets will be implemented next.");
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
                    <Button onClick={handleGenerateTickets} variant="outline">
                        Generate Tickets
                    </Button>
                    <Button onClick={handleGenerateIds} disabled={generating}>
                        {generating ? "Generating…" : "Generate Unique IDs"}
                    </Button>
                </div>
            </div>
        </Card>
    );
}
