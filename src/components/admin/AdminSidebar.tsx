"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Briefcase, FileText, MessageSquareText, Mail, LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/admin/jobs", label: "الوظائف", icon: Briefcase },
  { href: "/admin/applications", label: "الطلبات والسير الذاتية", icon: FileText },
  { href: "/admin/quotes", label: "طلبات عروض الأسعار", icon: MessageSquareText },
  { href: "/admin/messages", label: "رسائل التواصل", icon: Mail },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-64 flex-col border-e border-primary-100 bg-white">
      <div className="px-5 py-6">
        <span className="text-lg font-bold text-primary-700">RAN For Science</span>
        <p className="text-xs text-primary-900/50">لوحة التحكم</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        {links.map((link) => {
          const active = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-primary-50 text-primary-700" : "text-primary-900/70 hover:bg-primary-50"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <form action={logoutAction} className="border-t border-primary-100 p-3">
        <button
          type="submit"
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium text-primary-900/70 transition-colors hover:bg-primary-50"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </form>
    </aside>
  );
}
