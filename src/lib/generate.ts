import path from "path";
import fs from "fs";
import QRCode from "qrcode";
import { readEntries } from "@/actions/sheet";
import { createCanvas, loadImage, registerFont } from "canvas";

function now() {
    return new Date().toISOString();
}

export async function generateQrFiles() {
    const dir = path.join(process.cwd(), "qr");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const { entries } = await readEntries();

    if (!entries || entries.length === 0) {
        return { generated: 0, skipped: 0, errors: ["No entries found"] };
    }

    let generated = 0;
    let skipped = 0;

    const start = Date.now();
    console.log(
        `[${now()}] Starting QR generation for ${entries.length} entries`,
    );

    for (const entry of entries) {
        try {
            const filename = `${entry.registrationNumber}.png`;
            const filepath = path.join(dir, filename);

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
            console.log(
                `[${now()}] ✔ QR generated for ${entry.registrationNumber}`,
            );
        } catch {
            skipped++;
            console.error(
                `[${now()}] ✖ QR failed for ${entry.registrationNumber}`,
            );
        }
    }

    const end = Date.now();
    const duration = ((end - start) / 1000).toFixed(2);

    console.log(`\n=== QR Generation Summary ===`);
    console.log(`Started at: ${new Date(start).toISOString()}`);
    console.log(`Ended at:   ${new Date(end).toISOString()}`);
    console.log(`Duration:   ${duration} sec`);
    console.log(`Generated:  ${generated}`);
    console.log(`Skipped:    ${skipped}`);
    console.log(`=============================\n`);

    return { generated, skipped, duration: Number(duration) };
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

    const baseImage = await loadImage(baseTicketPath);
    const { entries } = await readEntries();

    if (!entries || entries.length === 0) {
        return {
            generated: 0,
            skipped: 0,
            errors: ["No entries found in the sheet"],
        };
    }

    let generated = 0;
    let skipped = 0;

    const start = Date.now();
    console.log(
        `[${now()}] Starting Ticket generation for ${entries.length} entries`,
    );

    for (const entry of entries) {
        try {
            const filename = `${entry.registrationNumber}.png`;
            const filepath = path.join(dir, filename);

            const canvas = createCanvas(baseImage.width, baseImage.height);
            const ctx = canvas.getContext("2d");

            ctx.drawImage(baseImage, 0, 0);

            const qrPath = path.join(process.cwd(), "qr", filename);
            const qrImage = await loadImage(qrPath);

            const size = 280 * 2;
            const x = 260;
            const y = canvas.height * 0.355;

            ctx.drawImage(qrImage, x, y, size, size);

            ctx.fillStyle = "#FFFFFF";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            const centerX = canvas.width / 2;

            // Name
            ctx.font = "bold 70px CinzelDecorative";
            ctx.fillText(entry.name || "N/A", centerX, canvas.height * 0.705);

            // Registration
            ctx.fillText(
                entry.registrationNumber,
                centerX,
                canvas.height * 0.81,
            );

            // Desk (static for now)
            ctx.font = "bold 58px CinzelDecorative";
            ctx.fillText("Desk F", centerX, canvas.height * 0.9);

            const buffer = canvas.toBuffer("image/png");
            fs.writeFileSync(filepath, buffer);

            generated++;
            console.log(
                `[${now()}] ✔ Ticket generated for ${entry.registrationNumber}`,
            );
        } catch {
            skipped++;
            console.warn(
                `[${now()}] ✖ Ticket failed for ${entry.registrationNumber}`,
            );
        }
    }

    const end = Date.now();
    const duration = ((end - start) / 1000).toFixed(2);

    console.log(`\n=== Ticket Generation Summary ===`);
    console.log(`Started at: ${new Date(start).toISOString()}`);
    console.log(`Ended at:   ${new Date(end).toISOString()}`);
    console.log(`Duration:   ${duration} sec`);
    console.log(`Generated:  ${generated}`);
    console.log(`Skipped:    ${skipped}`);
    console.log(`=================================\n`);

    return { generated, skipped, duration: Number(duration) };
}
