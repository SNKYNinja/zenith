import path from "path";
import fs from "fs";
import QRCode from "qrcode";
import { readEntries } from "@/actions/sheet";
import { createCanvas, loadImage, registerFont } from "canvas";
import { Entry } from "./config";

function now() {
    return new Date().toISOString();
}

// Helper function to force garbage collection and add delay
async function forceGarbageCollection() {
    if (global.gc) {
        global.gc();
    }
    // Small delay to allow memory cleanup
    await new Promise((resolve) => setTimeout(resolve, 10));
}

// Process entries in batches to prevent memory overflow
async function processBatch(entries: Entry[], batchSize: number, processor) {
    const results = { generated: 0, skipped: 0, errors: [] };

    for (let i = 0; i < entries.length; i += batchSize) {
        const batch = entries.slice(i, i + batchSize);
        console.log(
            `[${now()}] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(entries.length / batchSize)} (${batch.length} entries)`,
        );

        const batchResults = await processor(batch);
        results.generated += batchResults.generated;
        results.skipped += batchResults.skipped;
        results.errors.push(...(batchResults.errors || []));

        // Force garbage collection between batches
        await forceGarbageCollection();

        console.log(
            `[${now()}] Batch completed. Generated: ${batchResults.generated}, Skipped: ${batchResults.skipped}`,
        );
    }

    return results;
}

export async function generateQrFiles() {
    const dir = path.join(process.cwd(), "qr");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const { entries } = await readEntries();

    if (!entries || entries.length === 0) {
        return { generated: 0, skipped: 0, errors: ["No entries found"] };
    }

    const start = Date.now();
    console.log(
        `[${now()}] Starting QR generation for ${entries.length} entries`,
    );

    // Process QR codes in batches of 50
    const batchSize = 50;
    const results = await processBatch(entries, batchSize, async (batch) => {
        let generated = 0;
        let skipped = 0;
        const errors = [];

        for (const entry of batch) {
            try {
                const filename = `${entry.registrationNumber}.png`;
                const filepath = path.join(dir, filename);

                if (fs.existsSync(filepath)) {
                    skipped++;
                    continue;
                }

                const qrData = JSON.stringify({
                    registration: entry.registrationNumber,
                    name: entry.name,
                    email: entry.email,
                    uid: entry.uniqueId,
                    transaction: entry.transactionId,
                });

                const buffer = await QRCode.toBuffer(qrData, {
                    type: "png",
                    margin: 1,
                    width: 256,
                    color: {
                        dark: "#000000",
                        light: "#FFFFFF",
                    },
                });

                fs.writeFileSync(filepath, buffer);
                generated++;
            } catch (error) {
                skipped++;
                errors.push(
                    `QR failed for ${entry.registrationNumber}: ${error.message}`,
                );
            }
        }

        return { generated, skipped, errors };
    });

    const end = Date.now();
    const duration = ((end - start) / 1000).toFixed(2);

    console.log(`\n=== QR Generation Summary ===`);
    console.log(`Started at: ${new Date(start).toISOString()}`);
    console.log(`Ended at:   ${new Date(end).toISOString()}`);
    console.log(`Duration:   ${duration} sec`);
    console.log(`Generated:  ${results.generated}`);
    console.log(`Skipped:    ${results.skipped}`);
    console.log(`Errors:     ${results.errors.length}`);
    console.log(`=============================\n`);

    return {
        generated: results.generated,
        skipped: results.skipped,
        duration: Number(duration),
        errors: results.errors,
    };
}

export async function generateTicket() {
    const fontPath = path.join(
        process.cwd(),
        "public",
        "fonts",
        "CinzelDecorative-Bold.ttf",
    );
    registerFont(fontPath, { family: "CinzelDecorative" });

    const dir = path.join(process.cwd(), "ticket");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const baseTicketPath = path.join(process.cwd(), "public/base_ticket.png");
    if (!fs.existsSync(baseTicketPath)) {
        throw new Error(`Base ticket template not found at: ${baseTicketPath}`);
    }

    // Load base image once and keep reference
    const baseImage = await loadImage(baseTicketPath);
    const { entries } = await readEntries();

    if (!entries || entries.length === 0) {
        return {
            generated: 0,
            skipped: 0,
            errors: ["No entries found in the sheet"],
        };
    }

    const start = Date.now();
    console.log(
        `[${now()}] Starting Ticket generation for ${entries.length} entries`,
    );

    // Process tickets in smaller batches to manage memory
    const batchSize = 20; // Smaller batch size for memory-intensive ticket generation
    const results = await processBatch(entries, batchSize, async (batch) => {
        let generated = 0;
        let skipped = 0;
        const errors = [];

        for (const entry of batch) {
            let canvas = null;
            let qrImage = null;

            try {
                const filename = `${entry.registrationNumber}.png`;
                const filepath = path.join(dir, filename);

                if (fs.existsSync(filepath)) {
                    skipped++;
                    continue;
                }

                // Create canvas
                canvas = createCanvas(baseImage.width, baseImage.height);
                const ctx = canvas.getContext("2d");

                // Draw base image
                ctx.drawImage(baseImage, 0, 0);

                // Load QR image
                const qrPath = path.join(process.cwd(), "qr", filename);
                if (!fs.existsSync(qrPath)) {
                    errors.push(
                        `QR file not found for ${entry.registrationNumber}`,
                    );
                    skipped++;
                    continue;
                }

                qrImage = await loadImage(qrPath);

                // Draw QR code
                const size = 280 * 2;
                const x = 260;
                const y = canvas.height * 0.355;
                ctx.drawImage(qrImage, x, y, size, size);

                // Add text
                ctx.fillStyle = "#FFFFFF";
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";

                const centerX = canvas.width / 2;

                // Name
                ctx.font = "bold 70px CinzelDecorative";
                ctx.fillText(
                    entry.name || "N/A",
                    centerX,
                    canvas.height * 0.705,
                );

                // Registration
                ctx.fillText(
                    entry.registrationNumber,
                    centerX,
                    canvas.height * 0.81,
                );

                // Desk
                ctx.font = "bold 58px CinzelDecorative";
                ctx.fillText(
                    `Desk - ${entry.desk}`,
                    centerX,
                    canvas.height * 0.9,
                );

                // Generate and save
                const buffer = canvas.toBuffer("image/png");
                fs.writeFileSync(filepath, buffer);

                generated++;
            } catch (error) {
                skipped++;
                errors.push(
                    `Ticket failed for ${entry.registrationNumber}: ${error.message}`,
                );
            } finally {
                // Explicitly clean up references
                canvas = null;
                qrImage = null;
            }
        }

        return { generated, skipped, errors };
    });

    const end = Date.now();
    const duration = ((end - start) / 1000).toFixed(2);

    console.log(`\n=== Ticket Generation Summary ===`);
    console.log(`Started at: ${new Date(start).toISOString()}`);
    console.log(`Ended at:   ${new Date(end).toISOString()}`);
    console.log(`Duration:   ${duration} sec`);
    console.log(`Generated:  ${results.generated}`);
    console.log(`Skipped:    ${results.skipped}`);
    console.log(`Errors:     ${results.errors.length}`);
    console.log(`=================================\n`);

    return {
        generated: results.generated,
        skipped: results.skipped,
        duration: Number(duration),
        errors: results.errors,
    };
}
