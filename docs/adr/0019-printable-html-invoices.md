# ADR-0019: Printable HTML invoices instead of a PDF library

- **Status:** Accepted
- **Date:** 2026-10-19

## Context

Staff need to print invoices and delivery slips, mostly in Arabic. Most Node PDF libraries handle Arabic letter shaping and RTL poorly. Headless Chrome (Puppeteer) handles it well, but needs hundreds of MB of RAM.

## Decision

Invoices and delivery slips are **print-optimized HTML pages** in the dashboard (`@media print` CSS, A4/A5 layouts). Staff click "Print" or "Save as PDF" in the browser. Customers get a printable invoice page from the tracking page.

## Consequences

- Arabic renders correctly with no extra dependencies or RAM.
- No server-generated PDF files to email. If needed later (e.g. emailing invoices, ETA integration), add a PDF adapter as a separate service at that point.

## Alternatives considered

- **pdfmake / PDFKit:** weak Arabic shaping.
- **Puppeteer:** correct output, but too heavy for the current server.
