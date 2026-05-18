"use server";

import { getAllUsersForSearch } from "@/lib/server/firestore";
import { requireUser } from "@/lib/server/auth";

export interface UserSearchResult {
  uid: string;
  name: string;
  email: string;
  title?: string;
}

export async function getAllUsersForSearchAction(): Promise<UserSearchResult[]> {
  await requireUser();
  return getAllUsersForSearch();
}
