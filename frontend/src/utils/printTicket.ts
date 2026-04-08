/**
 * Prints a DOM element in isolation using an iframe.
 * Works with CSS Modules because it copies all parent stylesheets.
 * The user's browser print dialog can save as PDF.
 */
export function printElement(el: HTMLElement, title = 'Ticket'): void {
  const iframe = document.createElement('iframe');
  iframe.style.cssText =
    'position:fixed;top:-9999px;left:-9999px;width:800px;height:600px;opacity:0;pointer-events:none;';
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  if (!win) return;

  // Collect all CSS from parent document (handles CSS Modules hashed classes)
  const styles = Array.from(document.styleSheets)
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((r) => r.cssText)
          .join('\n');
      } catch {
        return '';
      }
    })
    .join('\n');

  const doc = win.document;
  doc.open();
  doc.write(`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    ${styles}
    /* Print overrides */
    * { box-sizing: border-box; }
    :root {
      --color-surface-lowest: #0d0d0d;
      --color-surface-container: #1e1e1e;
      --color-outline-variant: #2e2e2e;
      --color-on-surface: #e5e2e1;
      --color-on-surface-variant: #9a9a9a;
      --color-primary: #FF6B47;
      --color-on-primary: #1a1a1a;
    }
    html, body {
      margin: 0;
      padding: 24px;
      background: #111111;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      min-height: 100vh;
    }
    @media print {
      html, body {
        background: #111111 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      @page { margin: 1cm; size: A5 portrait; }
    }
  </style>
</head>
<body>
  ${el.outerHTML}
</body>
</html>`);
  doc.close();

  // Give assets a moment to load, then print
  setTimeout(() => {
    win.focus();
    win.print();
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 2000);
  }, 300);
}
