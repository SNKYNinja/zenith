"use server";
import nodemailer from "nodemailer";
import { readEntries, updateMailSentStatus } from "./sheet";
import plimit from "p-limit";
const limit = plimit(5);

export async function sendEmail(maxEmails: number) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.NEXT_PUBLIC_GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
    });

    const { entries } = await readEntries();
    const pending = entries.filter((e) => !e.mailSent);

    console.log(`\n[Email] Total pending: ${pending.length}`);
    if (pending.length === 0) {
        console.log("[Email] No pending emails to send.\n");
        return;
    }

    const toSend = pending.slice(0, maxEmails);
    console.log(`[Email] Processing ${toSend.length} emails...\n`);

    let successCount = 0;
    let failCount = 0;

    const start = Date.now();

    const tasks = toSend.map((entry) =>
        limit(async () => {
            try {
                await transporter.sendMail({
                    to: entry.email,
                    subject: "Your Garba Night Tickets Are Ready ✨",
                    html: `
                    <!DOCTYPE html>
                    <html>
                            <head>
                                <style>
                                    body {
                                        font-family: Arial, sans-serif;
                                        background-color: #f4f4f4;
                                        margin: 0;
                                        padding: 20px;
                                    }
                                    .container {
                                        background-color: #fff;
                                        padding: 20px;
                                        border-radius: 10px;
                                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                                        max-width: 600px;
                                        margin: auto;
                                        color: #333;
                                    }
                                    h1 {
                                        color: #d32f2f;
                                        font-size: 24px;
                                        text-align: center;
                                        margin-bottom: 20px;
                                        text-transform: uppercase;
                                    }
                                    p {
                                        font-size: 16px;
                                        line-height: 1.6;
                                        color: #555;
                                    }
                                    .pro-tip {
                                        background-color: #fff3cd;
                                        color: #856404;
                                        padding: 15px;
                                        border-radius: 5px;
                                        font-weight: bold;
                                        margin: 20px 0;
                                        line-height: 1.4;
                                    }
                                    .pro-tip ul {
                                        margin: 10px 0 0 20px; /* Adjusted margin for better spacing */
                                        padding: 0;
                                        list-style-type: disc;
                                    }
                                    .rules {
                                        background-color: #fff3cd;
                                        color: #856404;
                                        padding: 15px;
                                        border-radius: 5px;
                                        font-weight: bold;
                                        margin: 20px 0;
                                        line-height: 1.4;
                                    }
                                    .rules ul {
                                        margin: 10px 0 0 20px; /* Adjusted margin for better spacing */
                                        padding: 0;
                                        list-style-type: disc;
                                    }
                                    .desk-info {
                                        background-color: #e7f3fe;
                                        border: 1px solid #b8daff;
                                        color: #31708f;
                                        padding: 10px;
                                        border-radius: 5px;
                                        margin: 20px 0;
                                        font-weight: bold;
                                    }
                                    .alert-info {
                                        background-color: #f26a5c;
                                        border: 1px solid #b83325;
                                        color: white;
                                        padding: 10px;
                                        border-radius: 5px;
                                        margin: 20px 0;
                                        font-weight: bold;
                                    }
                                    .footer {
                                        text-align: center;
                                        margin-top: 40px;
                                    }
                                    .footer b {
                                        color: #d32f2f;
                                    }
                                    img {
                                        border-radius: 15px;
                                        width: 100%;
                                        margin: 20px 0;
                                    }
                                    span.emoji {
                                        font-size: 24px;
                                        line-height: 1em;
                                        display: inline-block;
                                        vertical-align: middle;
                                    }
                                </style>
                            </head>
                            <body>
                                <div class="container">
                                    <h1><span class="emoji">🎉</span> Your Garba Night Tickets Are Ready</h1>
                                    <p><strong>Dear ${entry.name},</strong></p>
                                    <div class="alert-info">
                                        <i>Only 2000 tickets are being rolled out. Rest will be sent tomorrow</i>
                                    </div>
                                    <p>The wait is over! Your ticket for Garba Night 2k25 is ready and is attached below <span class="emoji">🎉</span></p>
                                    <p>It is compulsory to bring your ticket and ID card, and you're all set for an unforgettable evening filled with vibrant music, joyous dance, and cherished memories!</p>
                                    <div class="pro-tip">
                                        <strong><span class="emoji">✨</span> Pro Tips:</strong>
                                         <ul>
                                            <li>Entry starts at 3:00 PM</li>
                                            <li>This pass is unique and can only be scanned once, so keep it close and don't share it.</li>
                                            <li>Please join the queue at your assigned desk and open your email prior due to potential internet issues to avoid delay in your entry.</li>
                                            <!--<li>Please ensure that your attire for Garba night aligns with the university's dress code and reflects decency.</li>-->
                                        </ul>
                                    </div>
                                    <div class="rules">
                                      <strong><span class="emoji">📚</span> Guidelines:</strong>
                                      <ul>
                                        <li>Bouncers will be present at the entry. No fake entries will be entertained.</li>
                                        <li>Please wear decent outfits and avoid revealing ones, keeping in mind the rainy season.</li>
                                        <li>Maintain discipline throughout the event.</li>
                                        <li>Any involvement in fights or misconduct will lead to strict action.</li>
                                      </ul>
                                    </div>
                                    <div class="desk-info">
                                        Boys Desk - A / B / C / D / E / F<br>
                                        Girls Desk - G / H / I / J / K / L
                                    </div>
                                    <p>Prepare to immerse yourself in the magic of the night. We can't wait to celebrate with you!</p>
                                    <img src="cid:ticket-${entry.registrationNumber}" alt="Garba Night Ticket">
                                    <div class="footer">
                                        <p>Best Regards,<br>
                                        <b>Gujarati Club</b></p>
                                    </div>
                                </div>
                            </body>
                            </html>
                    `,
                    attachments: [
                        {
                            filename: `${entry.registrationNumber}.png`,
                            path: `./ticket/${entry.registrationNumber}.png`,
                            cid: `ticket-${entry.registrationNumber}`,
                        },
                    ],
                });

                await updateMailSentStatus(entry.rowNumber, true);
                console.log(`[Sent] ${entry.name} (${entry.email})`);
                successCount++;
            } catch (err) {
                console.error(`[Failed] ${entry.name} (${entry.email})`, err);
                failCount++;
            }
        }),
    );

    await Promise.allSettled(tasks);

    const end = Date.now();
    const totalTime = (end - start) / 1000;
    const avgTime = totalTime / toSend.length;

    console.log("\n[Email Summary]");
    console.log(`Attempted: ${toSend.length}`);
    console.log(`Sent successfully: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Skipped (already sent): ${entries.length - pending.length}`);
    console.log(`Total time: ${totalTime.toFixed(2)}s`);
    console.log(`Average per mail: ${avgTime.toFixed(2)}s\n`);
}
