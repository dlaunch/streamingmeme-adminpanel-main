"use server";

import { redirect } from "next/navigation";
import { signInSchema, signUpSchema } from "@/lib/validations/auth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { userProfiles, userProfileRoles, userRoles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createSession,
  deleteSession,
  getSession as getSessionData,
} from "@/lib/session";

export type AuthActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function signIn(
  prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const rawFormData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validatedFields = signInSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0]?.message || "Invalid form data",
    };
  }

  const { email, password } = validatedFields.data;

  try {
    console.log("Attempting sign in for:", email);

    // Find user by email
    const userProfile = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.email, email))
      .limit(1);

    if (userProfile.length === 0) {
      console.log("User not found:", email);
      return { error: "Invalid email or password" };
    }

    const user = userProfile[0];

    // Check if user is active
    if (!user.isActive) {
      console.log("User account is inactive");
      return { error: "Account is inactive" };
    }

    // Verify password with bcrypt
    console.log("Verifying password...");
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      console.log("Password does not match");
      return { error: "Invalid email or password" };
    }

    // Create session
    console.log("Password verified, creating session");
    await createSession({
      userId: user.id,
      email: user.email,
    });

    console.log("Login successful, redirecting to dashboard");
  } catch (error) {
    console.error("Error signing in:", error);
    return { error: "An error occurred during sign in" };
  }

  redirect("/dashboard");
}

export async function signUp(
  prevState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const rawFormData = {
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validatedFields = signUpSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.issues[0]?.message || "Invalid form data",
    };
  }

  const { email, password, fullName } = validatedFields.data;

  try {
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return { error: "User with this email already exists" };
    }

    // Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user profile
    const newUser = await db
      .insert(userProfiles)
      .values({
        email,
        displayName: fullName,
        passwordHash,
        isActive: true,
      })
      .returning();

    if (newUser.length === 0) {
      return { error: "Failed to create user" };
    }

    // Assign default user role
    const userRole = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.roleKey, "user"))
      .limit(1);

    if (userRole.length > 0) {
      await db.insert(userProfileRoles).values({
        userId: newUser[0].id,
        roleId: userRole[0].id,
      });
    }

    return {
      success: true,
      message: "Account created successfully! You can now sign in.",
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return { error: "An error occurred during sign up" };
  }
}

export async function signOut(): Promise<void> {
  await deleteSession();
  redirect("/auth/sign-in");
}

export async function getSession() {
  return getSessionData();
}

export async function getUser() {
  const session = await getSessionData();
  if (!session) return null;

  const user = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, session.userId))
    .limit(1);

  return user[0] || null;
}

export async function getUserWithRoles() {
  const user = await getUser();
  if (!user) return null;

  try {
    const userWithRoles = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.id, user.id),
      with: {
        roles: {
          with: {
            role: true,
          },
        },
      },
    });

    return {
      id: user.id,
      email: user.email,
      profile: userWithRoles,
      roles: userWithRoles?.roles.map((r) => r.role.roleKey) || [],
    };
  } catch {
    return {
      id: user.id,
      email: user.email,
      profile: null,
      roles: [],
    };
  }
}

export async function hasRole(
  requiredRole: "admin" | "user"
): Promise<boolean> {
  const userWithRoles = await getUserWithRoles();
  if (!userWithRoles) return false;

  const roleHierarchy: Record<string, number> = { admin: 2, user: 1 };
  const userMaxRole = Math.max(
    ...userWithRoles.roles.map((r: string) => roleHierarchy[r] || 0)
  );

  return userMaxRole >= roleHierarchy[requiredRole];
}
