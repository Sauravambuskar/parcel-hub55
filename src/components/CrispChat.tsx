import { useEffect } from "react";
import { Crisp } from "crisp-sdk-web";

const CRISP_WEBSITE_ID = "0f163c1b-0824-46f1-9e7e-68aaa3c55367";

export function CrispChat() {
  useEffect(() => {
    Crisp.configure(CRISP_WEBSITE_ID);
  }, []);

  return null;
}

export default CrispChat;
