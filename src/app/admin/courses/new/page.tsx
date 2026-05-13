// design.md §3.11 — admin/courses/new form-row pattern.

import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/server/auth";

import { NewCourseForm } from "./form";

export const metadata: Metadata = { title: "建立新課程" };

export default async function NewCoursePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") redirect("/login");
  return (
    <NewCourseForm
      user={{ displayName: user.profileDisplayName || user.displayName, email: user.email }}
    />
  );
}
