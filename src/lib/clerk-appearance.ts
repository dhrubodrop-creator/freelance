import type { Appearance } from "@clerk/types";

export const clerkAppearance: Appearance = {
  variables: {
    colorPrimary: "#141e33",
    colorText: "#101929",
    colorTextSecondary: "#5b6472",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    borderRadius: "0.75rem",
    fontFamily: "var(--font-body)",
  },
  elements: {
    card: "shadow-none border border-border rounded-xl",
    headerTitle: "font-heading",
    formButtonPrimary:
      "bg-[#141e33] hover:bg-[#1c2b4a] text-sm normal-case font-medium",
    footerActionLink: "text-[#141e33] hover:text-[#f0a81e]",
    socialButtonsBlockButton: "border-border",
  },
};
