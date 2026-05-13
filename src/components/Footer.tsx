import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-border border-t py-10 text-center text-xs">
      <span className="text-subtle">
        © {new Date().getFullYear()} NTU Sociology · 引用本文請註明出處 ·{" "}
      </span>
      <Link href="/privacy" className="text-subtle hover:underline">
        隱私
      </Link>
      <span className="text-subtle"> · </span>
      <Link href="/tos" className="text-subtle hover:underline">
        條款
      </Link>
    </footer>
  );
}
