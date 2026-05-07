"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { toAppTime } from "@/lib/utils/date";
import { assignRole, toggleUserStatus } from "@/lib/actions/users";
import type { UserProfile, UserRoleRecord, UserProfileRole } from "@/lib/db/schema";

interface UserWithRoles extends UserProfile {
  roles: (UserProfileRole & { role: UserRoleRecord })[];
}

interface UsersListProps {
  users: UserWithRoles[];
  roles: UserRoleRecord[];
}

export function UsersList({ users, roles }: UsersListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const handleRoleChange = (userId: string, roleId: string) => {
    setUpdatingUserId(userId);
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("roleId", roleId);

    startTransition(async () => {
      const result = await assignRole({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
        router.refresh();
      }
      setUpdatingUserId(null);
    });
  };

  const handleToggleStatus = (userId: string) => {
    setUpdatingUserId(userId);
    const formData = new FormData();
    formData.append("userId", userId);

    startTransition(async () => {
      const result = await toggleUserStatus({}, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.message);
        router.refresh();
      }
      setUpdatingUserId(null);
    });
  };

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border rounded-lg">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
        <p className="text-muted-foreground">
          Users will appear here once they sign up.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const currentRole = user.roles[0]?.role;
            const fullName = user.displayName ||
              [user.firstName, user.lastName].filter(Boolean).join(" ") ||
              null;
            const initials = fullName
              ? fullName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : user.email.slice(0, 2).toUpperCase();

            return (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">
                      {fullName || "No name"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Select
                    value={currentRole?.id || ""}
                    onValueChange={(value) => handleRoleChange(user.id, value)}
                    disabled={isPending && updatingUserId === user.id}
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Select role">
                        {currentRole?.roleName || "No role"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.roleName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={user.isActive ? "bg-emerald-100/80 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : ""}
                  >
                    {user.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {format(toAppTime(user.createdAt), "MMM d, yyyy")}
                  </span>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={user.isActive}
                    disabled={true}
                    className="data-[state=checked]:bg-emerald-600/90 dark:data-[state=checked]:bg-emerald-600/80"
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
