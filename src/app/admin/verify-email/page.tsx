import VerifyEmailForm from "./VerifyEmailForm";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <p className="text-sm text-red-600">رابط التأكيد غير صالح.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-xl border border-primary-100 bg-white p-8 shadow-sm">
        <h1 className="text-center text-xl font-bold text-primary-800">تأكيد البريد الإلكتروني</h1>
        <div className="mt-8">
          <VerifyEmailForm token={token} />
        </div>
      </div>
    </div>
  );
}
