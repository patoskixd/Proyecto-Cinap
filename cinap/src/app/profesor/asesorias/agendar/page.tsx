import ScheduleWizard from "@/presentation/components/teacher/asesorias/agendar/ScheduleWizard";
import { SchedulingHttpRepo } from "@/infrastructure/teachers/asesorias/agendar/SchedulingHttpRepo";

export default async function Page() {
  const repo = new SchedulingHttpRepo();
  let data: any = {};
  try {
    data = await repo.getCreateData();
  } catch {
    data = { categories: [], servicesByCategory: {}, advisorsByService: {}, times: [] };
  }

  const props = {
    categories: data.categories || [],
    servicesByCategory: data.servicesByCategory || {},
    advisorsByService: data.advisorsByService || {},
    daysShort: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
    times: data.times || [],
    defaultTimezone: "America/Santiago",
  };

  return (
    <div className="p-6">
      <ScheduleWizard {...props} />
    </div>
  );
}
