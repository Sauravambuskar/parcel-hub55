import { useEffect } from "react";
import { ChatboxPosition, Crisp } from "crisp-sdk-web";
import { getAuthSession } from "@/lib/auth";

const CRISP_WEBSITE_ID = "0f163c1b-0824-46f1-9e7e-68aaa3c55367";
const CRISP_Z_INDEX = 2147483000;

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

export function CrispChat() {
  useEffect(() => {
    if (!configured) {
      Crisp.configure(CRISP_WEBSITE_ID);
      try {
        Crisp.setPosition(ChatboxPosition.Right);
        Crisp.setZIndex(CRISP_Z_INDEX);
      } catch {
        /* noop */
      }
      configured = true;
    }
    applySession();

    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth_session" || e.key === "prayog_auth") applySession();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return null;
}

export default CrispChat;
