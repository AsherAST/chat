import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CuentaPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
        Mi cuenta
      </h1>
      <div className="mt-6 max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-zinc-500">Nombre</dt>
            <dd className="font-medium text-zinc-900 dark:text-white">
              {user.name}
            </dd>
          </div>
          <div>
            <dt className="text-zinc-500">Correo electrónico</dt>
            <dd className="font-medium text-zinc-900 dark:text-white">
              {user.email}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
