"use client";

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function ConfirmDialog({
    open,
    onOpenChange,
    pendingInfo,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pendingInfo: {
        pendingCount: number | null;
        sender: string;
        sheet: string;
    };
    onConfirm: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Confirm Email Push</DialogTitle>
                    <DialogDescription asChild>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>
                                <b>Pending Emails:</b>{" "}
                                {pendingInfo.pendingCount ?? "Loading..."}
                            </p>
                            <p>
                                <b>Sender Email:</b> {pendingInfo.sender}
                            </p>
                            <p>
                                <b>Sheet:</b> {pendingInfo.sheet}
                            </p>
                        </div>
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button onClick={onConfirm}>Yes, Send</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
