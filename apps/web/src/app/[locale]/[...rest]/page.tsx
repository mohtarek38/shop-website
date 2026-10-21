import { notFound } from 'next/navigation';

/** Sends unknown paths under /ar or /en to the localized 404 page. */
export default function CatchAll() {
  notFound();
}
