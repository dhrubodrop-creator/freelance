import type { LocalizationResource } from "@clerk/types";

/**
 * QA-reported P2: the sign-in widget's own internal heading read Clerk's
 * unconfigured default ("Sign in to My Application") directly under a
 * correctly-branded "Sign in to Ropes" page headline — a visible, avoidable
 * first-impression defect. Clerk's `localization` prop is a partial
 * override, deep-merged with its built-in English defaults, so only the
 * two title strings that were actually wrong need to be set here.
 */
export const clerkLocalization: Partial<LocalizationResource> = {
  signIn: {
    start: {
      title: "Sign in to Ropes",
      subtitle: "Welcome back! Please sign in to continue",
    },
  },
} as Partial<LocalizationResource>;
