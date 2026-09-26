import { notFound, redirect } from "next/navigation";
import { getCurrentUser, isCurrentUserAdmin } from "@/lib/queries/profile";

/** Every admin page sits behind this check, and the database re-checks it on every read.
 *  The chrome comes from the shell layout above; this is the gate and nothing else. */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fadmin%2Fregistrations");
  if (!(await isCurrentUserAdmin())) notFound();

  return children;
}
