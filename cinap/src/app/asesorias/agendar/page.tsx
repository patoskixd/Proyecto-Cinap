import ScheduleWizard from "@/presentation/components/teacher/asesorias-agendar/ScheduleWizard";
import { headers } from "next/headers";

async function fetchCreateData() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  const baseUrl = `${proto}://${host}`;
  const res = await fetch(`${baseUrl}/api/asesorias/create-data`, {
    credentials: "include",
    cache: "no-store",
    headers: { cookie: h.get("cookie") || "" },
  });
  if (!res.ok)
    return {
      categories: [],
      servicesByCategory: {},
      advisorsByService: {},
      daysShort: [],
      times: [],
      defaultTimezone: "America/Santiago",
    };
  const data = await res.json();
  return {
    categories: data.categories || [],
    servicesByCategory: data.servicesByCategory || {},
    advisorsByService: data.advisorsByService || {},
    daysShort: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    times: data.times || [],
    defaultTimezone: "America/Santiago",
  };
}

export default async function Page() {
  const props = await fetchCreateData();
  return (
    <div className="p-6">
      <ScheduleWizard {...props} />
    </div>
  );
}

