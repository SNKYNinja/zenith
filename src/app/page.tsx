// Main dashboard page
import { HeaderBar } from "@/components/header";
import { EntriesTable } from "@/components/entries-table";
import { FeatureTracker } from "@/components/feature-tracker";

export default function Page() {
    return (
        <main className="container mx-auto p-4 space-y-4">
            <HeaderBar />
            <EntriesTable />
            <FeatureTracker />
        </main>
    );
}
