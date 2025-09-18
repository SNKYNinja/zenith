import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Mail,
    Users,
    FileSpreadsheet,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Play,
    X,
} from "lucide-react";
import { config, type Entry } from "@/lib/config";

interface EmailProgressDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: (
        onProgress?: (progress: EmailProgress) => void,
    ) => Promise<void>;
    pendingCount: number;
    maxEmails: number;
}

export interface EmailProgress {
    total: number;
    sent: number;
    failed: number;
    current: string;
    logs: EmailLog[];
    isComplete: boolean;
    error?: string;
}

export interface EmailLog {
    id: string;
    name: string;
    email: string;
    status: "pending" | "sending" | "success" | "failed";
    timestamp: Date;
    error?: string;
}

export function EmailProgressDialog({
    open,
    onOpenChange,
    onConfirm,
    pendingCount,
    maxEmails,
}: EmailProgressDialogProps) {
    const [step, setStep] = useState<"review" | "sending" | "complete">(
        "review",
    );
    const [progress, setProgress] = useState<EmailProgress>({
        total: 0,
        sent: 0,
        failed: 0,
        current: "",
        logs: [],
        isComplete: false,
    });

    const emailsToSend = Math.min(pendingCount, maxEmails);
    const remaining = Math.max(0, pendingCount - maxEmails);
    const progressPercentage =
        progress.total > 0
            ? ((progress.sent + progress.failed) / progress.total) * 100
            : 0;

    // Email configuration from your config file
    const emailConfig = {
        fromEmail: process.env.GMAIL_USER || "your-email@gmail.com",
        sheetName: config.google.range.split("!")[0] || "Sheet",
        spreadsheetId: config.google.spreadsheetId,
        service: "Gmail SMTP",
        pageSize: config.ui.pageSize,
    };

    const handleConfirm = async () => {
        setStep("sending");
        setProgress({
            total: emailsToSend,
            sent: 0,
            failed: 0,
            current: "Initializing...",
            logs: [],
            isComplete: false,
        });

        try {
            await onConfirm((newProgress) => {
                setProgress(newProgress);
                if (newProgress.isComplete) {
                    setStep("complete");
                }
            });
        } catch (error) {
            setProgress((prev) => ({
                ...prev,
                isComplete: true,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            }));
            setStep("complete");
        }
    };

    const handleClose = () => {
        if (step === "sending") {
            // Don't allow closing while sending
            return;
        }
        setStep("review");
        setProgress({
            total: 0,
            sent: 0,
            failed: 0,
            current: "",
            logs: [],
            isComplete: false,
        });
        onOpenChange(false);
    };

    const renderReviewStep = () => (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-red-600" />
                    Confirm Email Sending
                </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
                {/* Email Statistics */}
                <Card className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {emailsToSend}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Will be sent
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                                {remaining}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Remaining
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {pendingCount}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Total pending
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {maxEmails}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Batch limit
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Configuration Details */}
                <div className="grid gap-3">
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                            <div className="text-sm font-medium">
                                Sender Email
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {emailConfig.fromEmail}
                            </div>
                        </div>
                        <Badge variant="outline">{emailConfig.service}</Badge>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                            <div className="text-sm font-medium">
                                Data Source
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {emailConfig.sheetName}
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {emailConfig.spreadsheetId}
                            </div>
                        </div>
                        <Badge variant="secondary">Google Sheets</Badge>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                            <div className="text-sm font-medium">
                                Estimated Time
                            </div>
                            <div className="text-sm text-muted-foreground">
                                ~{Math.ceil(emailsToSend * 2)} seconds
                            </div>
                        </div>
                        <Badge variant="outline">Concurrent: 5</Badge>
                    </div>
                </div>

                {/* Warnings */}
                {remaining > 0 && (
                    <div className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                        <div className="flex-1">
                            <div className="text-sm font-medium text-orange-800">
                                Batch Limit Notice
                            </div>
                            <div className="text-sm text-orange-700">
                                Only {maxEmails} emails will be sent.{" "}
                                {remaining} will remain pending.
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleClose}>
                    Cancel
                </Button>
                <Button
                    onClick={handleConfirm}
                    disabled={emailsToSend === 0}
                    className="bg-red-600 hover:bg-red-700"
                >
                    <Play className="h-4 w-4 mr-2" />
                    Send {emailsToSend} Email{emailsToSend !== 1 ? "s" : ""}
                </Button>
            </div>
        </>
    );

    const renderSendingStep = () => (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-blue-600 animate-pulse" />
                    Sending Emails...
                </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
                {/* Progress Overview */}
                <Card className="p-4">
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>
                                {progress.sent + progress.failed} of{" "}
                                {progress.total}
                            </span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-lg font-semibold text-green-600">
                                    {progress.sent}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Sent
                                </div>
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-red-600">
                                    {progress.failed}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Failed
                                </div>
                            </div>
                            <div>
                                <div className="text-lg font-semibold text-blue-600">
                                    {progress.total -
                                        progress.sent -
                                        progress.failed}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Pending
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Current Status */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-800">
                        Current
                    </div>
                    <div className="text-sm text-blue-700">
                        {progress.current}
                    </div>
                </div>

                {/* Live Log */}
                <Card className="p-4">
                    <div className="text-sm font-medium mb-2">Email Log</div>
                    <ScrollArea className="h-48">
                        <div className="space-y-2">
                            {progress.logs.map((log) => (
                                <div
                                    key={log.id}
                                    className="flex items-center gap-2 text-xs p-2 rounded bg-muted/50"
                                >
                                    {log.status === "success" && (
                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                    )}
                                    {log.status === "failed" && (
                                        <XCircle className="h-3 w-3 text-red-600" />
                                    )}
                                    {log.status === "sending" && (
                                        <Clock className="h-3 w-3 text-blue-600 animate-spin" />
                                    )}
                                    {log.status === "pending" && (
                                        <Clock className="h-3 w-3 text-gray-400" />
                                    )}
                                    <div className="flex-1">
                                        <div className="font-medium">
                                            {log.name}
                                        </div>
                                        <div className="text-muted-foreground">
                                            {log.email}
                                        </div>
                                        {log.error && (
                                            <div className="text-red-600">
                                                {log.error}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-muted-foreground">
                                        {log.timestamp.toLocaleTimeString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>
            </div>
        </>
    );

    const renderCompleteStep = () => (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    {progress.error ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    {progress.error
                        ? "Email Sending Failed"
                        : "Email Sending Complete"}
                </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
                {progress.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="text-sm font-medium text-red-800">
                            Error
                        </div>
                        <div className="text-sm text-red-700">
                            {progress.error}
                        </div>
                    </div>
                )}

                <Card className="p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <div className="text-2xl font-bold text-green-600">
                                {progress.sent}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Successfully Sent
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-600">
                                {progress.failed}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Failed
                            </div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-gray-600">
                                {progress.total}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Total Processed
                            </div>
                        </div>
                    </div>
                </Card>

                {progress.logs.length > 0 && (
                    <Card className="p-4">
                        <div className="text-sm font-medium mb-2">Summary</div>
                        <ScrollArea className="h-32">
                            <div className="space-y-1">
                                {progress.logs
                                    .filter((log) => log.status === "failed")
                                    .map((log) => (
                                        <div
                                            key={log.id}
                                            className="text-xs text-red-600"
                                        >
                                            Failed: {log.name} ({log.email}) -{" "}
                                            {log.error}
                                        </div>
                                    ))}
                            </div>
                        </ScrollArea>
                    </Card>
                )}
            </div>

            <div className="flex justify-end pt-4">
                <Button onClick={handleClose}>
                    <X className="h-4 w-4 mr-2" />
                    Close
                </Button>
            </div>
        </>
    );

    return (
        <Dialog
            open={open}
            onOpenChange={step === "sending" ? () => {} : handleClose}
        >
            <DialogContent className="max-w-2xl max-h-[90vh]">
                {step === "review" && renderReviewStep()}
                {step === "sending" && renderSendingStep()}
                {step === "complete" && renderCompleteStep()}
            </DialogContent>
        </Dialog>
    );
}
