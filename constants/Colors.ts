/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    darkerTint: "#171717",
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: "#404040",
    darkerTint: "#262626",
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
  error: "#fb2c36",
  primary_100: "#F3EEFB",
  primary_200: "#E6DDF8",
  primary_300: "#DFD1FA",
  primary_400: "#D6C5F7",
  primary_500: "#C7B3EF",
  primary_600: "#B8A1E3",
  primary_700: "#b099dbff",
  primary_800: "#a288d3ff",
  primary_900: "#8E6EC9",
};
