import { getContactMessages } from "@/features/contact/data/contact.data";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { updateMessageStatus } from "@/features/contact/actions/status.actions";
import { messageStatusOptions } from "@/features/contact/constants/status-labels";

export default async function AdminMessagesPage() {
  const messages = await getContactMessages();

  return (
    <div>
      <h1 className="text-2xl font-bold text-primary-800">رسائل التواصل</h1>

      <div className="mt-6 flex flex-col gap-4">
        {messages.map((message) => (
          <div key={message.id} className="rounded-lg border border-primary-100 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-primary-800">
                  {message.name}
                  {message.subject ? ` — ${message.subject}` : ""}
                </p>
                <p className="mt-0.5 text-xs text-primary-900/50" dir="ltr">
                  {message.email}
                  {message.phone ? ` · ${message.phone}` : ""}
                </p>
              </div>
              <StatusSelect
                id={message.id}
                status={message.status}
                options={messageStatusOptions}
                onChange={updateMessageStatus}
              />
            </div>
            <p className="mt-3 whitespace-pre-line text-sm text-primary-900/80">{message.message}</p>
            <p className="mt-3 text-xs text-primary-900/40">
              {message.createdAt.toLocaleString("ar-SA")}
            </p>
          </div>
        ))}

        {messages.length === 0 && (
          <p className="rounded-lg border border-primary-100 bg-white px-4 py-8 text-center text-primary-900/50">
            لا توجد رسائل
          </p>
        )}
      </div>
    </div>
  );
}
