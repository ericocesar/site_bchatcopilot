const triggerSelector = '[data-demo-dialog-trigger], a[href="#contato"]';

export function initDemoDialog() {
  const dialog = document.querySelector("[data-demo-dialog]");
  if (!(dialog instanceof HTMLDialogElement)) return () => {};

  const open = (event) => {
    const trigger = event.target.closest?.(triggerSelector);
    if (!trigger) return;

    event.preventDefault();
    if (!dialog.open) dialog.showModal();

    window.requestAnimationFrame(() => {
      document.querySelector("#demo-name")?.focus({ preventScroll: true });
    });
  };

  const close = () => {
    if (dialog.open) dialog.close();
  };

  const closeButton = dialog.querySelector("[data-demo-dialog-close]");
  const dismissBackdrop = (event) => {
    if (event.target === dialog) close();
  };

  document.addEventListener("click", open);
  closeButton?.addEventListener("click", close);
  dialog.addEventListener("click", dismissBackdrop);

  return () => {
    document.removeEventListener("click", open);
    closeButton?.removeEventListener("click", close);
    dialog.removeEventListener("click", dismissBackdrop);
    if (dialog.open) dialog.close();
  };
}
