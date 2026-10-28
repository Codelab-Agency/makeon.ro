import type { Metadata } from "next";
import EventExperience from "@/components/event-experience";

export const metadata: Metadata = {
  title: "Evenimentul tău — Rulotă de cafea & bar mobil | Makeon",
  description: "Cafea de specialitate la evenimentul tău, cu rulota SwitchMORN sau barul mobil de interior. Descoperă formatele și solicită o ofertă personalizată.",
};

export default function EventsPage() { return <EventExperience />; }
