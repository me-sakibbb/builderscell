import { notFound, redirect } from "next/navigation";
import { ShellFrame } from "@/components/shell/frame";
import { getShellContext } from "@/lib/queries/profile";

/** The admin panel: its own rail, kept apart from the member area. Every admin page sits
 *  behind this check, and the database re-checks it on every read. */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { user, member, isAdmin, collapsed } = await getShellContext();
  if (!user) redirect("/login?next=%2Fadmin");
  if (!isAdmin) notFound();

  return (
    <ShellFrame member={member} isAdmin variant="admin" defaultCollapsed={collapsed}>
      {children}
    </ShellFrame>
  );
}
