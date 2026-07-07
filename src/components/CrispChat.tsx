import { useEffect } from "react";
import { ChatboxPosition, Crisp } from "crisp-sdk-web";
import { getAuthSession } from "@/lib/auth";

const CRISP_WEBSITE_ID = "0f163c1b-0824-46f1-9e7e-68aaa3c55367";
const CRISP_Z_INDEX = 2147483000;

let configured = false;
let crispMountFrame: number | null = null;

const clearStyleProperty = (element: HTMLElement, property: string) => {
  if (element.style.getPropertyValue(property)) {
    element.style.removeProperty(property);
  }
};

const setImportantStyle = (element: HTMLElement, property: string, value: string) => {
  if (
    element.style.getPropertyValue(property) !== value ||
    element.style.getPropertyPriority(property) !== "important"
  ) {
    element.style.setProperty(property, value, "important");
  }
};

const ensureCrispViewportMount = () => {
  const chatbox = document.getElementById("crisp-chatbox");
  if (!chatbox) return;

  if (chatbox.parentElement !== document.body) {
    document.body.appendChild(chatbox);
  }

  clearStyleProperty(chatbox, "bottom");
  clearStyleProperty(chatbox, "height");
  clearStyleProperty(chatbox, "left");
  clearStyleProperty(chatbox, "margin");
  clearStyleProperty(chatbox, "margin-bottom");
  clearStyleProperty(chatbox, "max-height");
  clearStyleProperty(chatbox, "max-width");
  clearStyleProperty(chatbox, "overflow");
  clearStyleProperty(chatbox, "overflow-x");
  clearStyleProperty(chatbox, "overflow-y");
  clearStyleProperty(chatbox, "transform");
  clearStyleProperty(chatbox, "width");
  setImportantStyle(chatbox, "position", "fixed");
  setImportantStyle(chatbox, "z-index", String(CRISP_Z_INDEX));

  const crispClient = chatbox.querySelector<HTMLElement>(".crisp-client");
  if (crispClient) {
    clearStyleProperty(crispClient, "max-height");
    clearStyleProperty(crispClient, "max-width");
    clearStyleProperty(crispClient, "overflow");
    clearStyleProperty(crispClient, "overflow-x");
    clearStyleProperty(crispClient, "overflow-y");
    clearStyleProperty(crispClient, "transform");
  }

  chatbox.querySelectorAll<HTMLIFrameElement>("iframe").forEach((iframe) => {
    clearStyleProperty(iframe, "max-height");
    clearStyleProperty(iframe, "max-width");
    clearStyleProperty(iframe, "overflow");
    clearStyleProperty(iframe, "transform");
  });
};

const scheduleCrispMountCheck = () => {
  if (crispMountFrame !== null) return;

  crispMountFrame = window.requestAnimationFrame(() => {
    crispMountFrame = null;
    ensureCrispViewportMount();
  });
};

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
