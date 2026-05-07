import { getUsers, getRoles } from "@/lib/actions/users";
import { UsersList } from "@/components/users/users-list";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const [users, roles] = await Promise.all([getUsers(), getRoles()]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Users</h2>
        <p className="text-muted-foreground">
          Manage user accounts and roles
        </p>
      </div>

      <UsersList users={users} roles={roles} />
    </div>
  );
}
