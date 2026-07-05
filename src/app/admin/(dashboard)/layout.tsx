import { redirect } from "next/navigation";
import { getValidAdminSession } from "@/lib/require-admin";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getValidAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1 p-6 sm:p-8">{children}</main>
    </div>
  );
}
