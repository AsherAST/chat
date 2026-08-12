import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import Navbar from "@/components/Navbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Navbar user={{ name: user.name, email: user.email }} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
