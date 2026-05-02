import { useState } from "react";
import { loginDoctorAdmin, type DoctorAdminSession } from "@/lib/auth";
import { Stethoscope, User, Lock, AlertCircle, Loader2 } from "lucide-react";

interface LoginPageProps {
  onLogin: (session: DoctorAdminSession) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError("الرجاء إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    setBusy(true);
    try {
      const session = await loginDoctorAdmin(username, password);
      if (!session) {
        setError("اسم المستخدم أو كلمة المرور غير صحيحة");
      } else {
        onLogin(session);
      }
    } catch {
      setError("حدث خطأ أثناء تسجيل الدخول، حاول مجدداً");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg mb-4">
            <Stethoscope className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">بوابة مشرف الطبيب</h1>
          <p className="text-sm text-muted-foreground mt-1">نظام راحة الطبي</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-card-border rounded-2xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">تسجيل الدخول</h2>
          <p className="text-sm text-muted-foreground mb-6">
            أدخل بيانات حسابك لمتابعة مواعيد طبيبك
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">اسم المستخدم</label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <User className="w-4 h-4" />
                </span>
                <input
                  data-testid="input-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="أدخل اسم المستخدم"
                  autoComplete="username"
                  className="w-full bg-background border border-input rounded-lg px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">كلمة المرور</label>
              <div className="relative">
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  data-testid="input-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="أدخل كلمة المرور"
                  autoComplete="current-password"
                  className="w-full bg-background border border-input rounded-lg px-4 py-2.5 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition"
                />
              </div>
            </div>

            {error && (
              <div
                data-testid="status-error"
                className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2.5 text-sm text-destructive"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              data-testid="button-login"
              type="submit"
              disabled={busy}
              className="w-full bg-primary text-primary-foreground rounded-lg py-2.5 text-sm font-semibold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جارٍ تسجيل الدخول…
                </>
              ) : (
                "تسجيل الدخول"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          للدعم التقني تواصل مع مدير النظام
        </p>
      </div>
    </div>
  );
}
