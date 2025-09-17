import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

type HeadersMap = {
    [key: string]: number;
};

export function mapHeaders(headers: string[]): HeadersMap {
    const map: HeadersMap = {};
    headers.forEach((h, i) => {
        map[h.trim().toLowerCase()] = i;
    });
    return map;
}

export function toA1(colIndex: number, rowIndex: number) {
    // colIndex: 0-based -> 'A', 'B', ...
    const chars: string[] = [];
    let n = colIndex + 1;
    while (n > 0) {
        const rem = (n - 1) % 26;
        chars.push(String.fromCharCode(65 + rem));
        n = Math.floor((n - 1) / 26);
    }
    return `${chars.reverse().join("")}${rowIndex}`;
}
