export interface CoachingTemplate {
  headline: string;
  coreIssue: string;
  whatWentWrongOrRight: string;
  whatToChangeNextTime: string;
}

export const COACHING_TEMPLATES: Record<string, CoachingTemplate> = {
  chasing: {
    headline: "The trade was defined more by chasing than by entry discipline.",
    coreIssue: "You committed after extension instead of entering from an advantaged location.",
    whatWentWrongOrRight:
      "The trace shows entry-quality patterns tied to chase behavior carrying meaningful influence.",
    whatToChangeNextTime:
      "Wait for pullback, reclaim, or cleaner breakout confirmation before committing size.",
  },
  failed_breakout_chasing: {
    headline: "The trade chased breakout confirmation and then wore the failed breakout.",
    coreIssue: "You paid up for breakout continuation without enough proof that the breakout would hold.",
    whatWentWrongOrRight:
      "The entry trace ties late breakout participation directly to failed-breakout evidence instead of to a clean continuation.",
    whatToChangeNextTime:
      "Require tighter breakout confirmation, cleaner reclaim support, or a less extended entry before committing.",
  },
  adding_into_weakness: {
    headline: "Size was added into weakness instead of into constructive strength.",
    coreIssue: "The trade kept increasing risk while price action was weakening.",
    whatWentWrongOrRight:
      "The scaling and management evidence points to weak adds doing more damage than helping the trade.",
    whatToChangeNextTime:
      "Only add when price is holding structure or proving strength, not while it is slipping.",
  },
  averaging_down: {
    headline: "Risk was increased lower instead of being reduced when the trade weakened.",
    coreIssue: "The trade averaged down into weakness rather than improving the position from strength.",
    whatWentWrongOrRight:
      "The scaling trace shows lower-quality re-adds and rescue adds increasing exposure after the trade was already deteriorating.",
    whatToChangeNextTime:
      "Do not add just to improve basis. Either de-risk or wait for clear structural repair before considering more size.",
  },
  adding_into_strength: {
    headline: "Adds were aligned with strength rather than weakness.",
    coreIssue: "Your size increases stayed aligned with constructive movement.",
    whatWentWrongOrRight:
      "The scaling trace shows strength-aware adds contributing positively to the trade path.",
    whatToChangeNextTime:
      "Keep building size only when price confirms strength and risk stays defined.",
  },
  poor_profit_protection: {
    headline: "Profit protection failed after the trade offered open profit.",
    coreIssue: "Open profit was not protected once the trade had enough room to justify defense.",
    whatWentWrongOrRight:
      "The management and exit evidence shows too much giveback relative to available protection opportunities.",
    whatToChangeNextTime:
      "Reduce earlier or tighten protection once the trade has meaningful open profit to defend.",
  },
  strong_profit_protection: {
    headline: "Profit protection was one of the strongest parts of the trade.",
    coreIssue: "Risk was defended in a way that preserved gains without collapsing the trade.",
    whatWentWrongOrRight:
      "The management trace shows constructive profit-protection behavior carrying real weight.",
    whatToChangeNextTime:
      "Keep using timely protection once open profit is meaningful and structure starts to matter.",
  },
  strong_loss_containment: {
    headline: "Loss containment was one of the strongest parts of the trade.",
    coreIssue: "When the trade weakened, risk was contained before the loss became much larger.",
    whatWentWrongOrRight:
      "The exit and reduction evidence shows disciplined containment instead of frozen overholding.",
    whatToChangeNextTime:
      "Keep defending quickly when structure breaks, even if other parts of the trade still need work.",
  },
  premature_exit: {
    headline: "The trade exited winner potential too early.",
    coreIssue: "You managed parts of the trade well enough to create a winner, but final exit timing still cut off too much continuation.",
    whatWentWrongOrRight:
      "The trade carried constructive management evidence, but the exit-side trace still shows continuation or winner quality left behind.",
    whatToChangeNextTime:
      "Keep the same setup discipline, but hold the last piece longer unless structure actually fails or a real target is reached.",
  },
  undersized_winner: {
    headline: "The setup worked, but the winner stayed too small to capitalize on it.",
    coreIssue: "Position size never matched the quality of the opportunity, so a good trade was under-monetized.",
    whatWentWrongOrRight:
      "The trace shows winner opportunity existed, but building size stayed too limited to take advantage of it.",
    whatToChangeNextTime:
      "When the setup is truly working, press size in a planned way instead of keeping the position too small all the way through.",
  },
  strong_winner_management: {
    headline: "Winner management was one of the strongest parts of the trade.",
    coreIssue: "Open profit was managed constructively instead of being rushed or given back carelessly.",
    whatWentWrongOrRight:
      "The management trace shows timely trimming, protection, and constructive winner handling carrying real weight.",
    whatToChangeNextTime:
      "Keep protecting and managing winners with the same patience and structure when the trade continues to behave well.",
  },
  flip_flopping: {
    headline: "The trade showed unstable back-and-forth management.",
    coreIssue: "Repeated trim and re-add behavior created instability instead of clearer trade control.",
    whatWentWrongOrRight:
      "The repeated management storyline points to inconsistent decision sequencing across the trade.",
    whatToChangeNextTime:
      "Simplify the plan after the first reduction instead of repeatedly reversing decisions.",
  },
  overtrading: {
    headline: "Execution tempo became too busy relative to the trade quality.",
    coreIssue: "The trade accumulated too many execution decisions for the quality of the setup.",
    whatWentWrongOrRight:
      "The behavior evidence points to a noisy execution pattern that added complexity without improving control.",
    whatToChangeNextTime:
      "Slow the decision cycle and require a clearer structural reason before each additional action.",
  },
  structured_execution: {
    headline: "Execution was structured and disciplined through the trade.",
    coreIssue: "The trade was managed with organized entry, sizing, and defensive behavior.",
    whatWentWrongOrRight:
      "The strongest behavior signals point to disciplined execution rather than impulsive management.",
    whatToChangeNextTime:
      "Keep reinforcing the same structure-first execution process on similar setups.",
  },
};
