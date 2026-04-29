"use client";

import { useEffect } from "react";

const IMAGE_NAV_LINK_ID = "wstv-image-nav-link";

export default function ImageNavInjector() {
  useEffect(() => {
    function injectImageNavLink() {
      if (document.getElementById(IMAGE_NAV_LINK_ID)) return;

      const storyboardLink = document.querySelector<HTMLAnchorElement>('a[href="/storyboard"]');
      const nav = storyboardLink?.parentElement;
      if (!storyboardLink || !nav) return;

      const imageLink = document.createElement("a");
      imageLink.id = IMAGE_NAV_LINK_ID;
      imageLink.href = "/image";
      imageLink.className = storyboardLink.className;
      imageLink.innerHTML = `
        <span class="grid h-5 w-5 place-items-center rounded-full bg-white/[0.06] text-[11px] text-white/70 transition-all group-hover:bg-white/[0.1] group-hover:text-white">▧</span>
        Image
      `;

      nav.insertBefore(imageLink, storyboardLink);
    }

    injectImageNavLink();

    const observer = new MutationObserver(injectImageNavLink);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
