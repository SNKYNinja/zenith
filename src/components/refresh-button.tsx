"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

export function RefreshButton({ className }: { className?: string }) {
    const { mutate } = useSWRConfig();
    const [loading, setLoading] = useState(false);

    async function onRefresh() {
        setLoading(true);
        try {
            // clear server cache
            await fetch("/api/entries/refresh", { method: "POST" });
            // revalidate all entry keys
            await mutate(
                (key) =>
                    typeof key === "string" && key.startsWith("/api/entries"),
                undefined,
                {
                    revalidate: true,
                    populateCache: false,
                },
            );
            toast.success("Data Refreshed");
            // optional: inform listeners
            window.dispatchEvent(new CustomEvent("entries:refresh"));
        } catch (err: any) {
            toast.error(
                `Refresh failed${err?.message ? `: ${err.message}` : ""}`,
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className={className}
        >
            <RotateCcw className="mr-2 h-4 w-4" />
            {loading ? "Refreshing..." : "Refresh"}
        </Button>
    );
}
