import { ShellFrame } from "@/components/shell/frame";
import { getShellContext } from "@/lib/queries/profile";

/** Topbar and rail for every member page but the landing one, the auth screens and the
 *  admin panel, which has its own frame. The campaign pages are public, so this carries
 *  on without a member. */
export default async function ShellLayout({ children }: LayoutProps<"/">) {
  const { member, isAdmin, collapsed } = await getShellContext();

  return (
    <ShellFrame member={member} isAdmin={isAdmin} defaultCollapsed={collapsed}>
      {children}
    </ShellFrame>
  );
}
