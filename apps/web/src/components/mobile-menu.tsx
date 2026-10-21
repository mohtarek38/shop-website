'use client';

import { Menu, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link, usePathname } from '@/i18n/navigation';

export interface MobileMenuProps {
  labels: { open: string; close: string; categories: string; account: string };
  categories: { href: string; label: string }[];
  accountLinks: { href: string; label: string }[];
  /** Rendered at the top of the drawer (the logo, from the server component). */
  header: React.ReactNode;
}

/** Slide-in navigation for small screens. Uses <dialog> for focus trapping and Escape. */
export function MobileMenu({ labels, categories, accountLinks, header }: MobileMenuProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const pathname = usePathname();

  // Close after navigating.
  useEffect(() => {
    dialog.current?.close();
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className="p-1 lg:hidden"
        aria-label={labels.open}
        aria-haspopup="dialog"
        onClick={() => dialog.current?.showModal()}
      >
        <Menu className="size-6" aria-hidden />
      </button>

      <dialog
        ref={dialog}
        aria-label={labels.open}
        // Click on the backdrop (outside the panel) closes the menu.
        onClick={(event) => event.target === dialog.current && dialog.current?.close()}
        className="fixed inset-y-0 ms-0 me-auto h-dvh max-h-none w-72 max-w-[85vw] bg-background p-0 text-text backdrop:bg-black/40"
      >
        <div className="flex h-full flex-col gap-6 overflow-y-auto p-4">
          <div className="flex items-center justify-between">
            {header}
            <button
              type="button"
              aria-label={labels.close}
              onClick={() => dialog.current?.close()}
              className="p-1"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <MenuSection title={labels.categories} links={categories} />
          <MenuSection title={labels.account} links={accountLinks} />
        </div>
      </dialog>
    </>
  );
}

function MenuSection({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <nav aria-label={title}>
      <h2 className="mb-2 text-xs font-bold text-muted">{title}</h2>
      <ul className="flex flex-col">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link href={href} className="block rounded-control px-2 py-2 text-sm hover:bg-surface">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
