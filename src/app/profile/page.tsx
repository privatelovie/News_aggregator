import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function ProfilePage() {
  const session = await getCurrentUser();

  if (!session?.user) {
    redirect("/login?callbackUrl=/profile");
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-4rem)] w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Account
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 dark:text-white">
          Profile
        </h1>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
            <dt className="text-sm text-slate-500 dark:text-slate-400">Name</dt>
            <dd className="mt-1 font-medium">
              {session.user.name ?? "Not provided"}
            </dd>
          </div>
          <div className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
            <dt className="text-sm text-slate-500 dark:text-slate-400">Email</dt>
            <dd className="mt-1 font-medium">
              {session.user.email ?? "Not provided"}
            </dd>
          </div>
          <div className="rounded-md border border-slate-200 p-4 dark:border-slate-800">
            <dt className="text-sm text-slate-500 dark:text-slate-400">User ID</dt>
            <dd className="mt-1 break-all font-medium">{session.user.id}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
