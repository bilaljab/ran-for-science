import ForgotPasswordForm from "./ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-primary-100 bg-white p-8 shadow-sm">
        <h1 className="text-center text-xl font-bold text-primary-800">نسيت كلمة المرور؟</h1>
        <p className="mt-1 text-center text-sm text-primary-900/70">
          أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور
        </p>
        <div className="mt-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}
