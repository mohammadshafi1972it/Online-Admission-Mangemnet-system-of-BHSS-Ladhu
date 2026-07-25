/**
 * Reliable print utility for embedded web applications, forms, and certificates.
 */
export function triggerPrint(elementId?: string): void {
  try {
    if (elementId && typeof document !== 'undefined') {
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    }

    if (typeof window !== 'undefined') {
      window.focus();
      // Use requestAnimationFrame to ensure layout changes finish before browser opens print dialog
      requestAnimationFrame(() => {
        try {
          window.print();
        } catch (err) {
          console.error('window.print() error:', err);
          window.print();
        }
      });
    }
  } catch (error) {
    console.error('Print trigger failed:', error);
    if (typeof window !== 'undefined') {
      window.print();
    }
  }
}

