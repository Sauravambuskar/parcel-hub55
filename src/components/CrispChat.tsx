import { useEffect } from "react";
import { ChatboxPosition, Crisp } from "crisp-sdk-web";
import { getAuthSession } from "@/lib/auth";

const CRISP_WEBSITE_ID = "0f163c1b-0824-46f1-9e7e-68aaa3c55367";
const CRISP_Z_INDEX = 2147483000;

let configured = false;

const ensureCrispViewportMount = () => {
  const chatbox = document.getElementById("crisp-chatbox");
  if (!chatbox) return;

  if (chatbox.parentElement !== document.body) {
    document.body.appendChild(chatbox);
  }

  chatbox.style.removeProperty("bottom");
  chatbox.style.removeProperty("height");
  chatbox.style.removeProperty("left");
  chatbox.style.removeProperty("margin");
  chatbox.style.removeProperty("margin-bottom");
  chatbox.style.removeProperty("max-height");
  chatbox.style.removeProperty("max-width");
  chatbox.style.removeProperty("overflow");
  chatbox.style.removeProperty("overflow-x");
  chatbox.style.removeProperty("overflow-y");
  chatbox.style.removeProperty("right");
  chatbox.style.removeProperty("top");
  chatbox.style.removeProperty("transform");
  chatbox.style.removeProperty("width");

  const crispClient = chatbox.querySelector<HTMLElement>(".crisp-client");
  crispClient?.style.removeProperty("max-height");
  crispClient?.style.removeProperty("max-width");
  crispClient?.style.removeProperty("overflow");
  crispClient?.style.removeProperty("overflow-x");
  crispClient?.style.removeProperty("overflow-y");
  crispClient?.style.removeProperty("transform");

  chatbox.querySelectorAll<HTMLIFrameElement>("iframe").forEach((iframe) => {
    iframe.style.removeProperty("max-height");
    iframe.style.removeProperty("max-width");
    iframe.style.removeProperty("overflow");
    iframe.style.removeProperty("transform");
  });
};

const scheduleCrispMountCheck = () => window.requestAnimationFrame(ensureCrispViewportMount);

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
    scheduleCrispMountCheck();

    const observer = new MutationObserver(scheduleCrispMountCheck);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["class", "style"],
      childList: true,
      subtree: true,
    });

    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth_session" || e.key === "prayog_auth") applySession();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("resize", scheduleCrispMountCheck);

    return () => {
      observer.disconnect();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("resize", scheduleCrispMountCheck);
    };
  }, []);

  return null;
}

export default CrispChat;
