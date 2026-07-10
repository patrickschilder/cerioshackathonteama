// Re-export theme constants for use in TypeScript (e.g. inline styles, canvas)
export const colors = {
    primary: "#004B53",
    primaryDark: "#003740",
    primaryLight: "#006672",
    accent: "#F1A800",
    accentDark: "#C98C00",
    accentLight: "#FFC433",
    text: "#1B2430",
    textMuted: "#5A6475",
    surface: "#FFFFFF",
    surfaceAlt: "#F4F6F8",
    border: "#DDE1E7",
    error: "#D9293A",
    success: "#1E8A44",
} as const;

export const fonts = {
    sans: '"Inter", system-ui, -apple-system, sans-serif',
} as const;
