import { RevokeSessionsButton } from "@/components/admin/RevokeSessionsButton";

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary-800">الإعدادات</h1>

      <div className="mt-6 max-w-lg rounded-lg border border-primary-100 bg-white p-5">
        <p className="font-semibold text-primary-800">الأمان</p>
        <p className="mt-1 text-sm text-primary-900/70">
          إذا كنت تشك أن أحد أجهزتك أو جلساتك تم اختراقها، يمكنك تسجيل الخروج من جميع الجلسات فوراً
          (بما فيها هذه الجلسة).
        </p>
        <div className="mt-4">
          <RevokeSessionsButton />
        </div>
      </div>
    </div>
  );
}
