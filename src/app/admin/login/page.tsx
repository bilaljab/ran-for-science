import Link from "next/link";
import LoginForm from "./LoginForm";

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-primary-100 bg-white p-8 shadow-sm">
        <h1 className="text-center text-xl font-bold text-primary-800">
          تسجيل الدخول للوحة التحكم
        </h1>
        <p className="mt-1 text-center text-sm text-primary-900/60">RAN For Science</p>
        <div className="mt-8">
          <LoginForm />
        </div>
        <Link
          href="/admin/forgot-password"
          className="mt-4 block text-center text-sm text-primary-600 hover:text-primary-700"
        >
          نسيت كلمة المرور؟
        </Link>
      </div>
    </div>
  );
}
