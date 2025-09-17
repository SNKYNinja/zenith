"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import { refreshEntriesCache } from "@/actions/cache";

export function RefreshButton({ className }: { className?: string }) {
    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(false);

    async function onRefresh() {
        setLoading(true);
        startTransition(async () => {
            try {
                const res = await refreshEntriesCache();

                if (!res.ok) throw new Error(res.error || "Failed to refresh");

                toast.success(`Cache cleared for "${res.cleared}"`);
                window.dispatchEvent(new CustomEvent("entries:refresh"));
            } catch (err: any) {
                toast.error(
                    `Refresh failed${err?.message ? `: ${err.message}` : ""}`,
                );
            } finally {
                setLoading(false);
            }
        });
    }

    return (
        <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={loading || isPending}
            className={className}
        >
            <RotateCcw className="h-4 w-4" />
            {loading || isPending ? "Refreshing..." : "Refresh"}
        </Button>
    );
}
