// "Veja em ação": opens the YouTube video in a modal <dialog> (80% of the viewport), already
// playing with sound. The iframe is created inside the click handler so the user gesture
// carries autoplay permission (allow="autoplay"), and removed on close so playback stops.

export function initVideoDialog() {
  const dialog = document.querySelector("[data-video-dialog]");
  const triggers = [...document.querySelectorAll("[data-video-open]")];
  if (!dialog || !triggers.length) return () => {};

  const frame = dialog.querySelector("[data-video-frame]");
  const closeButton = dialog.querySelector("[data-video-close]");
  let opener = null;

  const open = (event) => {
    const trigger = event.currentTarget;
    opener = trigger;
    const id = encodeURIComponent(trigger.dataset.videoOpen);
    const iframe = document.createElement("iframe");
    // Controls and keyboard stay on: the video starts with sound, so the visitor must be able to
    // pause, mute and go fullscreen. iv_load_policy=3 drops cards; cc_load_policy=0 starts captions off.
    iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1&iv_load_policy=3&cc_load_policy=0`;
    iframe.title = trigger.dataset.videoTitle || "Vídeo";
    iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    frame.replaceChildren(iframe);
    dialog.showModal();
  };
  const close = () => dialog.close();
  const onClose = () => {
    frame.replaceChildren();
    opener?.focus({ preventScroll: true });
  };
  // A click on the backdrop lands on the <dialog> itself, outside the frame.
  const onBackdrop = (event) => { if (event.target === dialog) close(); };

  triggers.forEach((trigger) => trigger.addEventListener("click", open));
  closeButton.addEventListener("click", close);
  dialog.addEventListener("click", onBackdrop);
  dialog.addEventListener("close", onClose);

  return () => {
    triggers.forEach((trigger) => trigger.removeEventListener("click", open));
    closeButton.removeEventListener("click", close);
    dialog.removeEventListener("click", onBackdrop);
    dialog.removeEventListener("close", onClose);
    if (dialog.open) dialog.close();
  };
}
