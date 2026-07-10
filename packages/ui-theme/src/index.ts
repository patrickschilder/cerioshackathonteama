// Re-export theme constants for use in TypeScript (e.g. inline styles, canvas)
export const colors = {
    primary: "#212B46",
    primaryDark: "#161C30",
    primaryLight: "#3A4870",
    accent: "#66E09F",
    accentDark: "#3FB87D",
    accentLight: "#B9F2D5",
    text: "#212B46",
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
