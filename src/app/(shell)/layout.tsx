import { cookies } from "next/headers";
import { ShellFrame } from "@/components/shell/frame";
import { RAIL_COOKIE } from "@/components/shell/nav";
import type { Member } from "@/components/shell/sidebar";
import { getCurrentUser, getProfileWithInstitution, initialsFrom, isCurrentUserAdmin } from "@/lib/queries/profile";

/** Topbar and rail for every page but the landing one and the auth screens. The campaign
 *  pages are public, so this resolves a member when there is one and carries on when not. */
export default async function ShellLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const profile = user ? await getProfileWithInstitution(user.id) : null;
  const isAdmin = user ? await isCurrentUserAdmin() : false;

  const name = profile?.full_name ?? user?.email ?? "";
  const member: Member | null = user
    ? { name, email: profile?.email ?? user.email ?? "", initials: initialsFrom(name || "?") }
    : null;

  const collapsed = (await cookies()).get(RAIL_COOKIE)?.value === "1";

  return (
    <ShellFrame member={member} isAdmin={isAdmin} defaultCollapsed={collapsed}>
      {children}
    </ShellFrame>
  );
}
