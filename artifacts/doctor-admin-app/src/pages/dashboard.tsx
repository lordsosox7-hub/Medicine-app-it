import { useState, useMemo } from "react";
import { type DoctorAdminSession, logoutDoctorAdmin } from "@/lib/auth";
import { useDoctorAppointments, markTicketScanned, type AppointmentWithPatient, type ScanResult } from "@/lib/hooks";
import {
  Calendar,
  Clock,
  CheckCircle,
  Users,
  LogOut,
  QrCode,
  History,
  Stethoscope,
  XCircle,
  AlertCircle,
  RefreshCw,
  ScanLine,
  ChevronDown,
} from "lucide-react";
import { useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";

type Tab = "today" | "scanner" | "history";

interface DashboardProps {
  session: DoctorAdminSession;
  onLogout: () => void;
}

export default function Dashboard({ session, onLogout }: DashboardProps) {
  const [tab, setTab] = useState<Tab>("today");
  const { data: appointments, isLoading } = useDoctorAppointments(session.doctor_id);

  const handleLogout = () => {
    logoutDoctorAdmin();
    onLogout();
  };

  const today = new Date().toISOString().split("T")[0];
  const todayAppts = appointments.filter((a) => a.appointment_date === today);
  const upcomingCount = todayAppts.filter((a) => a.status === "upcoming").length;
  const completedToday = todayAppts.filter((a) => a.status === "completed").length;
  const totalCompleted = appointments.filter((a) => a.status === "completed").length;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "today", label: "اليوم", icon: <Calendar className="w-4 h-4" /> },
    { id: "scanner", label: "ماسح QR", icon: <QrCode className="w-4 h-4" /> },
    { id: "history", label: "السجل", icon: <History className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="bg-sidebar text-sidebar-foreground w-full lg:w-64 lg:min-h-screen flex flex-col">
        {/* Brand */}
        <div className="p-5 border-b border-sidebar-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center shrink-0">
            <Stethoscope className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight truncate">{session.doctor_name}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{session.doctor_specialty}</p>
          </div>
        </div>

        {/* Nav tabs (hidden on mobile — shown below header) */}
        <nav className="hidden lg:flex flex-col gap-1 p-3 flex-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              data-testid={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition w-full text-right ${
                tab === t.id
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        {/* Logout */}
        <div className="hidden lg:block p-3 border-t border-sidebar-border">
          <button
            data-testid="button-logout"
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition w-full"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-0">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-card border-b border-card-border">
          <button
            data-testid="button-logout-mobile"
            onClick={handleLogout}
            className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
          <div className="text-center">
            <p className="font-semibold text-sm text-foreground leading-tight">{session.doctor_name}</p>
            <p className="text-xs text-muted-foreground">{session.doctor_specialty}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Stethoscope className="w-5 h-5 text-primary" />
          </div>
        </div>

        {/* Stats */}
        <div className="p-4 lg:p-6 border-b border-border">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              label="مواعيد اليوم"
              value={isLoading ? "…" : String(todayAppts.length)}
              icon={<Calendar className="w-4 h-4" />}
              color="primary"
            />
            <StatCard
              label="قادمة اليوم"
              value={isLoading ? "…" : String(upcomingCount)}
              icon={<Clock className="w-4 h-4" />}
              color="muted"
            />
            <StatCard
              label="مكتملة اليوم"
              value={isLoading ? "…" : String(completedToday)}
              icon={<CheckCircle className="w-4 h-4" />}
              color="success"
            />
            <StatCard
              label="إجمالي الزيارات"
              value={isLoading ? "…" : String(totalCompleted)}
              icon={<Users className="w-4 h-4" />}
              color="primary"
            />
          </div>
        </div>

        {/* Mobile tab bar */}
        <div className="lg:hidden flex border-b border-border bg-card">
          {tabs.map((t) => (
            <button
              key={t.id}
              data-testid={`tab-mobile-${t.id}`}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition ${
                tab === t.id
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-auto">
          {tab === "today" && (
            <TodayTab appointments={appointments} isLoading={isLoading} />
          )}
          {tab === "scanner" && (
            <ScannerTab doctorId={session.doctor_id} />
          )}
          {tab === "history" && (
            <HistoryTab appointments={appointments} isLoading={isLoading} />
          )}
        </div>
      </main>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "primary" | "muted" | "success";
}) {
  const styles = {
    primary: "bg-primary/10 text-primary",
    muted: "bg-muted text-muted-foreground",
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  };

  return (
    <div
      data-testid={`stat-${label}`}
      className="bg-card border border-card-border rounded-xl p-4 flex flex-col gap-2"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${styles[color]}`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  upcoming: { label: "قادم", className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
  completed: { label: "مكتمل", className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
  cancelled: { label: "ملغى", className: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
};

function StatusBadge({ status }: { status: "upcoming" | "completed" | "cancelled" }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.upcoming;
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.className}`}>
      {config.label}
    </span>
  );
}

// ─── Appointment Row ──────────────────────────────────────────────────────────

function AppointmentRow({ appt }: { appt: AppointmentWithPatient }) {
  return (
    <div
      data-testid={`row-appointment-${appt.id}`}
      className="bg-card border border-card-border rounded-xl px-4 py-3 flex items-center gap-3"
    >
      <div className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1.5 rounded-lg shrink-0 tabular-nums">
        {appt.appointment_time}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {appt.patient_name ?? "مريض"}
        </p>
        <p className="text-xs text-muted-foreground">
          #{appt.id.slice(0, 8).toUpperCase()}
        </p>
      </div>
      <StatusBadge status={appt.status} />
    </div>
  );
}

// ─── Today Tab ────────────────────────────────────────────────────────────────

function TodayTab({
  appointments,
  isLoading,
}: {
  appointments: AppointmentWithPatient[];
  isLoading: boolean;
}) {
  const today = new Date().toISOString().split("T")[0];
  const todayList = useMemo(
    () =>
      appointments
        .filter((a) => a.appointment_date === today)
        .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time)),
    [appointments, today],
  );

  const dateLabel = new Date().toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">مواعيد اليوم</h2>
          <p className="text-sm text-muted-foreground">{dateLabel}</p>
        </div>
        <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
          {isLoading ? "…" : `${todayList.length} موعد`}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : todayList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">لا توجد مواعيد اليوم</p>
          <p className="text-sm text-muted-foreground/60 mt-1">ستظهر مواعيد اليوم هنا</p>
        </div>
      ) : (
        <div className="space-y-3">
          {todayList.map((appt) => (
            <AppointmentRow key={appt.id} appt={appt} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Scanner Tab ──────────────────────────────────────────────────────────────

function ScannerTab({ doctorId }: { doctorId: string }) {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [parseError, setParseError] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    setCameraError(null);
    setParseError(false);
    setScanResult(null);
    hasScannedRef.current = false;

    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      setScanning(true);

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (hasScannedRef.current || processing) return;
          hasScannedRef.current = true;

          await stopScanner();
          setProcessing(true);
          try {
            const parsed = JSON.parse(decodedText);
            if (!parsed?.id) throw new Error("no_id");
            const result = await markTicketScanned(parsed.id, doctorId);
            setScanResult(result);
          } catch {
            setParseError(true);
            setScanResult(null);
          } finally {
            setProcessing(false);
          }
        },
        () => {},
      );
    } catch (err: any) {
      setScanning(false);
      if (err?.message?.includes("Permission")) {
        setCameraError("يرجى السماح بالوصول إلى الكاميرا في إعدادات المتصفح");
      } else {
        setCameraError("تعذّر تشغيل الكاميرا. تأكد من السماح بإذن الكاميرا.");
      }
    }
  }, [doctorId, processing, stopScanner]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const reset = async () => {
    setScanResult(null);
    setParseError(false);
    hasScannedRef.current = false;
    await startScanner();
  };

  const done = !!scanResult || parseError;

  return (
    <div className="p-4 lg:p-6 max-w-lg mx-auto space-y-4">
      <div>
        <h2 className="text-lg font-bold text-foreground">ماسح QR</h2>
        <p className="text-sm text-muted-foreground">امسح رمز QR الخاص بتذكرة الموعد</p>
      </div>

      {/* Scanner area */}
      {!done && !processing && (
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
          {scanning ? (
            <div className="relative">
              <div id="qr-reader" className="w-full" />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <p className="text-white text-sm text-center font-medium">
                  وجّه الكاميرا نحو رمز QR في التذكرة
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <ScanLine className="w-10 h-10 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">جاهز للمسح</p>
                <p className="text-sm text-muted-foreground mt-1">
                  اضغط لتشغيل الكاميرا ومسح تذكرة الموعد
                </p>
              </div>
              {cameraError && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive flex items-start gap-2 text-right">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{cameraError}</span>
                </div>
              )}
              <button
                data-testid="button-start-scan"
                onClick={startScanner}
                className="bg-primary text-primary-foreground rounded-xl px-6 py-3 font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition"
              >
                <QrCode className="w-4 h-4" />
                تشغيل الكاميرا
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stop scanning button */}
      {scanning && !done && (
        <button
          data-testid="button-stop-scan"
          onClick={stopScanner}
          className="w-full border border-border rounded-xl py-2.5 text-sm text-muted-foreground hover:text-foreground transition"
        >
          إيقاف الكاميرا
        </button>
      )}

      {/* Processing */}
      {processing && (
        <div className="bg-card border border-card-border rounded-2xl p-8 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center animate-pulse">
            <QrCode className="w-7 h-7 text-primary" />
          </div>
          <p className="font-semibold text-foreground">جارٍ التحقق من التذكرة…</p>
        </div>
      )}

      {/* Parse error */}
      {parseError && (
        <ScanResultCard
          icon={<AlertCircle className="w-10 h-10" />}
          color="red"
          title="رمز غير صالح"
          subtitle="لم يتم التعرف على هذا الرمز، تأكد أنه تذكرة موعد"
          onReset={reset}
        />
      )}

      {/* Scan results */}
      {scanResult && (
        <>
          {scanResult.status === "marked_used" && (
            <ScanResultCard
              icon={<CheckCircle className="w-10 h-10" />}
              color="green"
              title="تم التحقق بنجاح ✓"
              subtitle="تم تسجيل دخول المريض بنجاح"
              appointment={scanResult.appointment}
              onReset={reset}
            />
          )}
          {scanResult.status === "already_used" && (
            <ScanResultCard
              icon={<XCircle className="w-10 h-10" />}
              color="red"
              title="تم الاستخدام مسبقاً"
              subtitle="هذه التذكرة سبق مسحها واستخدامها"
              appointment={scanResult.appointment}
              onReset={reset}
            />
          )}
          {scanResult.status === "wrong_doctor" && (
            <ScanResultCard
              icon={<XCircle className="w-10 h-10" />}
              color="red"
              title="موعد طبيب آخر"
              subtitle="هذا الموعد غير مخصص لطبيبك، لا يمكن تأكيده"
              onReset={reset}
            />
          )}
          {scanResult.status === "cancelled" && (
            <ScanResultCard
              icon={<XCircle className="w-10 h-10" />}
              color="red"
              title="موعد ملغى"
              subtitle="هذا الموعد تم إلغاؤه ولا يمكن تسجيله"
              appointment={scanResult.appointment}
              onReset={reset}
            />
          )}
          {scanResult.status === "not_found" && (
            <ScanResultCard
              icon={<AlertCircle className="w-10 h-10" />}
              color="red"
              title="الموعد غير موجود"
              subtitle="لم يتم العثور على هذا الموعد في النظام"
              onReset={reset}
            />
          )}
        </>
      )}
    </div>
  );
}

function ScanResultCard({
  icon,
  color,
  title,
  subtitle,
  appointment,
  onReset,
}: {
  icon: React.ReactNode;
  color: "green" | "red";
  title: string;
  subtitle: string;
  appointment?: AppointmentWithPatient | null;
  onReset: () => void;
}) {
  const colorStyles = {
    green: {
      bg: "bg-green-50 dark:bg-green-900/20",
      border: "border-green-200 dark:border-green-800",
      icon: "text-green-600 dark:text-green-400",
      title: "text-green-700 dark:text-green-300",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-900/20",
      border: "border-red-200 dark:border-red-800",
      icon: "text-red-600 dark:text-red-400",
      title: "text-red-700 dark:text-red-300",
    },
  };
  const s = colorStyles[color];

  return (
    <div className="space-y-3">
      <div
        data-testid="status-scan-result"
        className={`${s.bg} ${s.border} border rounded-2xl p-6 flex flex-col items-center gap-3 text-center`}
      >
        <div className={s.icon}>{icon}</div>
        <div>
          <p className={`font-bold text-lg ${s.title}`}>{title}</p>
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
      </div>

      {appointment && (
        <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            تفاصيل الموعد
          </p>
          <div className="divide-y divide-border">
            {[
              { label: "رقم التذكرة", value: `#${appointment.id.slice(0, 8).toUpperCase()}` },
              { label: "تاريخ الموعد", value: appointment.appointment_date },
              { label: "وقت الموعد", value: appointment.appointment_time },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        data-testid="button-scan-again"
        onClick={onReset}
        className="w-full bg-primary text-primary-foreground rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition"
      >
        <RefreshCw className="w-4 h-4" />
        مسح تذكرة أخرى
      </button>
    </div>
  );
}

// ─── History Tab ──────────────────────────────────────────────────────────────

function HistoryTab({
  appointments,
  isLoading,
}: {
  appointments: AppointmentWithPatient[];
  isLoading: boolean;
}) {
  const grouped = useMemo(() => {
    const map = new Map<string, AppointmentWithPatient[]>();
    for (const a of appointments) {
      if (!map.has(a.appointment_date)) map.set(a.appointment_date, []);
      map.get(a.appointment_date)!.push(a);
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [appointments]);

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">سجل المواعيد</h2>
          <p className="text-sm text-muted-foreground">جميع المواعيد مرتبة حسب التاريخ</p>
        </div>
        <span className="text-xs font-medium bg-primary/10 text-primary px-2.5 py-1 rounded-full">
          {isLoading ? "…" : `${appointments.length} موعد`}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <History className="w-12 h-12 text-muted-foreground/40 mb-3" />
          <p className="font-medium text-muted-foreground">لا توجد مواعيد بعد</p>
          <p className="text-sm text-muted-foreground/60 mt-1">ستظهر المواعيد هنا عند إضافتها</p>
        </div>
      ) : (
        <div className="space-y-5">
          {grouped.map(([date, list]) => {
            const label = new Date(date).toLocaleDateString("ar-SA", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            return (
              <div key={date} data-testid={`group-date-${date}`}>
                <div className="flex items-center justify-between bg-primary/8 border border-primary/20 rounded-lg px-3 py-2 mb-2">
                  <span className="text-sm font-semibold text-primary">{label}</span>
                  <span className="text-xs text-primary/70">{list.length} موعد</span>
                </div>
                <div className="space-y-2">
                  {list
                    .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time))
                    .map((appt) => (
                      <AppointmentRow key={appt.id} appt={appt} />
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
