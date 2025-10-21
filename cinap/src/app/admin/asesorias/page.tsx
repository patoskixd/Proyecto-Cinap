import ReservationsPageScreen from "@/presentation/components/asesorias/ReservationsPageScreen";

export default function AdminReservationsPage() {
  return <ReservationsPageScreen allowedRoles={["admin"]} />;
}
