"use client";

import useSWR from "swr";
import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Entry = {
    registrationNumber: string;
    name: string;
    email: string;
    phoneNumber: string;
    residencyStatus: string;
    uniqueId: string | null;
    transactionId: string;
    mailSent: boolean;
    rowNumber: number;
};

type ApiResponse = {
    entries: Entry[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
};

const fetcher = (url: string) =>
    fetch(url, { cache: "no-store", next: { revalidate: 0 } }).then((r) =>
        r.json(),
    );

export function EntriesTable() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Set<number>>(new Set());

    const { data, isLoading, mutate } = useSWR<ApiResponse>(
        `/api/entries?page=${page}&pageSize=${pageSize}`,
        fetcher,
        {
            revalidateOnFocus: false,
            keepPreviousData: true,
        },
    );

    useEffect(() => {
        const h = () => mutate();
        window.addEventListener("entries:refresh", h);
        return () => window.removeEventListener("entries:refresh", h);
    }, [mutate]);

    const entries = data?.entries || [];

    const filtered = useMemo(() => {
        if (!query.trim()) return entries;
        const q = query.toLowerCase();
        return entries.filter(
            (e) =>
                e.registrationNumber.toLowerCase().includes(q) ||
                e.name.toLowerCase().includes(q) ||
                e.email.toLowerCase().includes(q) ||
                e.transactionId.toLowerCase().includes(q),
        );
    }, [entries, query]);

    function nextPage() {
        if (!data) return;
        if (page < data.totalPages) {
            setSelected(new Set());
            setPage(page + 1);
        }
    }
    function prevPage() {
        if (page > 1) {
            setSelected(new Set());
            setPage(page - 1);
        }
    }

    const currentIds = filtered.map((e) => e.rowNumber);
    const allOnPageSelected =
        currentIds.length > 0 && currentIds.every((id) => selected.has(id));

    function toggleAllOnPage() {
        const next = new Set(selected);
        if (allOnPageSelected) currentIds.forEach((id) => next.delete(id));
        else currentIds.forEach((id) => next.add(id));
        setSelected(next);
    }

    function toggleRow(id: number) {
        const next = new Set(selected);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelected(next);
    }

    return (
        <Card className="p-4">
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-4">
                    <Input
                        placeholder="Search name, reg no, email, or transaction ID"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="max-w-md"
                    />
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-muted-foreground">
                            Rows
                        </label>
                        <select
                            className="border rounded-md text-sm px-2 py-1 bg-background"
                            value={pageSize}
                            onChange={(e) => {
                                setPage(1);
                                setSelected(new Set());
                                setPageSize(Number(e.target.value));
                            }}
                        >
                            {[25, 50, 100, 200].map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        {isLoading
                            ? "Loading…"
                            : `Total: ${data?.total ?? 0} • Page ${data?.page ?? 1} / ${data?.totalPages ?? 1}`}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm">
                            Selected: {selected.size}
                        </span>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelected(new Set())}
                            disabled={selected.size === 0}
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            </div>

            <div className="w-full overflow-auto mt-3">
                <Table>
                    <TableCaption className="text-xs text-muted-foreground">
                        {isLoading
                            ? "Loading entries..."
                            : `Showing page ${data?.page || 1} of ${data?.totalPages || 1}`}
                    </TableCaption>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={allOnPageSelected}
                                    onCheckedChange={toggleAllOnPage}
                                    aria-label="select all on page"
                                />
                            </TableHead>
                            <TableHead className="w-10">Sent</TableHead>
                            <TableHead>Registration Number</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Phone</TableHead>
                            <TableHead>Hosteller/Day Scholar</TableHead>
                            <TableHead>Unique ID</TableHead>
                            <TableHead>Transaction ID</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 8 }).map((_, i) => (
                                <TableRow key={`sk-${i}`}>
                                    <TableCell>
                                        <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-40 bg-muted rounded animate-pulse" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-28 bg-muted rounded animate-pulse" />
                                    </TableCell>
                                    <TableCell>
                                        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : filtered?.length ? (
                            filtered.map((e) => (
                                <TableRow key={e.rowNumber}>
                                    <TableCell className="align-middle">
                                        <Checkbox
                                            checked={selected.has(e.rowNumber)}
                                            onCheckedChange={() =>
                                                toggleRow(e.rowNumber)
                                            }
                                            aria-label={`select row ${e.rowNumber}`}
                                        />
                                    </TableCell>
                                    <TableCell className="align-middle">
                                        <Checkbox
                                            checked={e.mailSent}
                                            disabled
                                            aria-label="sent status"
                                        />
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap align-middle">
                                        {e.registrationNumber}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap align-middle">
                                        {e.name}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap align-middle">
                                        {e.email}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap align-middle">
                                        {e.phoneNumber}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap align-middle">
                                        {e.residencyStatus}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap align-middle">
                                        {e.uniqueId || "-"}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap align-middle">
                                        {e.transactionId}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={9}
                                    className="text-center text-sm text-muted-foreground"
                                >
                                    No entries found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="flex items-center justify-between mt-4">
                <Button
                    variant="outline"
                    onClick={prevPage}
                    disabled={!data || (data?.page ?? 1) <= 1}
                >
                    Previous
                </Button>
                <div className="text-sm text-muted-foreground">
                    Page {data?.page ?? 1} of {data?.totalPages ?? 1}
                </div>
                <Button
                    variant="outline"
                    onClick={nextPage}
                    disabled={
                        !data || (data?.page ?? 1) >= (data?.totalPages ?? 1)
                    }
                >
                    Next
                </Button>
            </div>
        </Card>
    );
}
