import { redirect } from "next/navigation";
import { ProfileControlCenter } from "@/components/profile/profile-control-center";
import { getCurrentUser } from "@/lib/session";

export default async function ProfilePage() {
  const session = await getCurrentUser();

  if (!session?.user) {
    redirect("/login?callbackUrl=/profile");
  }

  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[86rem] flex-col gap-5 px-3 py-5 sm:px-5 lg:px-6">
      <section className="rounded-[1.5rem] border-[5px] border-black bg-white p-5 shadow-[8px_8px_0_#050505] dark:bg-slate-950">
        <p className="text-sm font-black uppercase tracking-wide text-[#2b0b64] dark:text-[#ffd24a]">
          Account
        </p>
        <h1 className="mt-3 text-4xl font-black uppercase text-slate-950 dark:text-white">
          Profile
        </h1>

        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border-[3px] border-black p-4">
            <dt className="text-sm text-slate-500 dark:text-slate-400">Name</dt>
            <dd className="mt-1 font-medium">
              {session.user.name ?? "Not provided"}
            </dd>
          </div>
          <div className="rounded-2xl border-[3px] border-black p-4">
            <dt className="text-sm text-slate-500 dark:text-slate-400">Email</dt>
            <dd className="mt-1 font-medium">
              {session.user.email ?? "Not provided"}
            </dd>
          </div>
          <div className="rounded-2xl border-[3px] border-black p-4 sm:col-span-2">
            <dt className="text-sm text-slate-500 dark:text-slate-400">User ID</dt>
            <dd className="mt-1 break-all font-medium">{session.user.id}</dd>
          </div>
        </dl>
      </section>

      <ProfileControlCenter />
    </main>
  );
}
