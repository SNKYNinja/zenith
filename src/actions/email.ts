"use server";

import nodemailer from "nodemailer";
import { readEntries } from "./sheet";
import fs from "fs";

export async function sendEmail() {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });

    const { entries } = await readEntries();

    for (const entry of entries) {
        try {
            await transporter.sendMail({
                to: entry.email,
                subject: "Garba Ticket",
                html: `<div>
                                <h2>Hello ${entry.name}</h2>
                                <p>Here is your ticket:</p>
                                <img src="cid:{entry.registrationNumber}"
                                          alt="Ticket"
                                          style="max-width:300px; display:block; margin:auto;" />
                              </div>`,
                attachments: [
                    {
                        filename: `${entry.registrationNumber}.png`,
                        content: fs.readFileSync(
                            `/public/ticket/${entry.registrationNumber}.png`,
                        ),
                        cid: entry.registrationNumber,
                    },
                ],
            });

            console.log(`Mail sent to ${entry.name}`);
        } catch (err) {
            console.error(err);
        }
    }
}
