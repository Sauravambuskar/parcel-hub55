import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";
import { getAuthSession } from "@/lib/auth";

const CRISP_WEBSITE_ID = "0f163c1b-0824-46f1-9e7e-68aaa3c55367";

// Bottom offsets (px) — lifted on mobile to clear the bottom navigation bar.
const DESKTOP_OFFSET = 24;
const MOBILE_OFFSET = 88;
const MOBILE_BREAKPOINT = 768;

let configured = false;

const applySession = () => {
  const session = getAuthSession();
  if (!session) {
    try {
      Crisp.setTokenId();
      Crisp.session.reset();
    } catch {
      /* noop */
    }
    return;
  }

  try {
    Crisp.setTokenId(session.user_id);
    const name = session.full_name || session.userName;
    if (name) Crisp.user.setNickname(name);
    if (session.phone) Crisp.user.setPhone(session.phone);
  } catch {
    /* noop */
  }
};

const applyOffset = () => {
  const isMobile = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
  try {
    Crisp.setPosition("right");
    Crisp.setVerticalOffset(isMobile ? MOBILE_OFFSET : DESKTOP_OFFSET);
  } catch {
    /* noop */
  }
};

export function CrispChat() {
  useEffect(() => {
    if (!configured) {
      Crisp.configure(CRISP_WEBSITE_ID);
      configured = true;
    }
    applySession();
    applyOffset();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth_session" || e.key === "prayog_auth") applySession();
    };
    const onResize = () => applyOffset();
    window.addEventListener("storage", onStorage);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return null;
}

export default CrispChat;
