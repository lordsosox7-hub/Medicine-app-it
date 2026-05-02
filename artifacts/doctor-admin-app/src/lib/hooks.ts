import { useEffect, useState, useCallback } from "react";
import { supabase } from "./supabase";

export interface AppointmentWithPatient {
  id: string;
  user_id: string;
  doctor_id: string;
  appointment_date: string;
  appointment_time: string;
  status: "upcoming" | "completed" | "cancelled";
  created_at: string;
  patient_name: string | null;
}

export function useDoctorAppointments(doctorId: string) {
  const [data, setData] = useState<AppointmentWithPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    if (!doctorId) return;
    const { data: rows, error: err } = await supabase
      .from("appointments")
      .select(
        "id, user_id, doctor_id, appointment_date, appointment_time, status, created_at",
      )
      .eq("doctor_id", doctorId)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: true });

    if (err) {
      setError(err.message);
      setIsLoading(false);
      return;
    }

    const enriched: AppointmentWithPatient[] = (rows ?? []).map((r: any) => ({
      ...r,
      patient_name: null,
    }));

    setData(enriched);
    setIsLoading(false);
  }, [doctorId]);

  useEffect(() => {
    setIsLoading(true);
    fetchAppointments();

    const channel = supabase
      .channel(`doctor-appts-${doctorId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
          filter: `doctor_id=eq.${doctorId}`,
        },
        () => {
          fetchAppointments();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [doctorId, fetchAppointments]);

  return { data, isLoading, error, refetch: fetchAppointments };
}

export interface ScanResult {
  status: "marked_used" | "already_used" | "wrong_doctor" | "cancelled" | "not_found";
  appointment: AppointmentWithPatient | null;
}

export async function markTicketScanned(
  appointmentId: string,
  doctorId: string,
): Promise<ScanResult> {
  const { data, error } = await supabase
    .from("appointments")
    .select("id, user_id, doctor_id, appointment_date, appointment_time, status, created_at")
    .eq("id", appointmentId)
    .maybeSingle();

  if (error || !data) return { status: "not_found", appointment: null };

  const appt = { ...data, patient_name: null } as AppointmentWithPatient;

  if (data.doctor_id !== doctorId) return { status: "wrong_doctor", appointment: appt };
  if (data.status === "completed") return { status: "already_used", appointment: appt };
  if (data.status === "cancelled") return { status: "cancelled", appointment: appt };

  const { error: updateError } = await supabase
    .from("appointments")
    .update({ status: "completed" })
    .eq("id", appointmentId);

  if (updateError) throw updateError;

  return { status: "marked_used", appointment: { ...appt, status: "completed" } };
}
