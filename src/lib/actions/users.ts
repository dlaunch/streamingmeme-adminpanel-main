"use server";

import { db } from "@/lib/db";
import { userProfiles, userProfileRoles, userRoles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getUser, hasRole } from "./auth";
import { revalidatePath } from "next/cache";

export type UserActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function getUsers() {
  const users = await db.query.userProfiles.findMany({
    with: {
      roles: {
        with: {
          role: true,
        },
      },
    },
    orderBy: [desc(userProfiles.createdAt)],
  });

  return users;
}

export async function getRoles() {
  const roles = await db.select().from(userRoles);
  return roles;
}

export async function assignRole(
  prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const currentUser = await getUser();
  if (!currentUser) {
    return { error: "Unauthorized" };
  }

  const isAdmin = await hasRole("admin");
  if (!isAdmin) {
    return { error: "Only admins can assign roles" };
  }

  const userId = formData.get("userId") as string;
  const roleId = formData.get("roleId") as string;

  if (!userId || !roleId) {
    return { error: "Missing required fields" };
  }

  try {
    // Check if user already has this role
    const existingRole = await db
      .select()
      .from(userProfileRoles)
      .where(eq(userProfileRoles.userId, userId))
      .limit(1);

    if (existingRole.length > 0) {
      // Update existing role
      await db
        .update(userProfileRoles)
        .set({
          roleId,
          assignedAt: new Date(),
        })
        .where(eq(userProfileRoles.userId, userId));
    } else {
      // Create new role assignment
      await db.insert(userProfileRoles).values({
        userId,
        roleId,
      });
    }

    revalidatePath("/users");

    return { success: true, message: "Role assigned successfully" };
  } catch (error) {
    console.error("Error assigning role:", error);
    return { error: "Failed to assign role" };
  }
}

export async function toggleUserStatus(
  prevState: UserActionState,
  formData: FormData
): Promise<UserActionState> {
  const currentUser = await getUser();
  if (!currentUser) {
    return { error: "Unauthorized" };
  }

  const isAdmin = await hasRole("admin");
  if (!isAdmin) {
    return { error: "Only admins can manage users" };
  }

  const userId = formData.get("userId") as string;

  if (!userId) {
    return { error: "Missing user ID" };
  }

  if (userId === currentUser.id) {
    return { error: "You cannot deactivate your own account" };
  }

  try {
    const user = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, userId))
      .limit(1);

    if (user.length === 0) {
      return { error: "User not found" };
    }

    await db
      .update(userProfiles)
      .set({
        isActive: !user[0].isActive,
        updatedAt: new Date(),
      })
      .where(eq(userProfiles.id, userId));

    revalidatePath("/users");

    return {
      success: true,
      message: `User ${user[0].isActive ? "deactivated" : "activated"} successfully`,
    };
  } catch (error) {
    console.error("Error toggling user status:", error);
    return { error: "Failed to update user status" };
  }
}
