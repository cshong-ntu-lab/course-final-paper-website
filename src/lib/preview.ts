// Who may see which drafts on /preview. Students preview their own draft in
// the site's layout; other students' unpublished work stays private.

import { isReportByAuthor } from "@/lib/authors";
import type { Role } from "@/lib/types";

interface PreviewReport {
  uid: string;
  authorUid?: string;
  coAuthors?: { uid: string }[];
  publishedAt: unknown;
}

interface Viewer {
  uid: string;
  role: Role;
}

/** The latest draft is visible to admins, the report's owner, its author and co-authors. */
export function canPreviewDraft(report: PreviewReport, viewer: Viewer): boolean {
  return (
    viewer.role === "admin" || report.uid === viewer.uid || isReportByAuthor(report, viewer.uid)
  );
}

/** The /preview feed: the viewer's own drafts, plus what the public home already shows. */
export function isInPreviewFeed(report: PreviewReport, viewer: Viewer): boolean {
  return report.publishedAt != null || canPreviewDraft(report, viewer);
}
