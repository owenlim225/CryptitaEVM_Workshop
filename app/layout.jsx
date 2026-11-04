import "../web/style.css";
import "../web/editor.css";

export const metadata = {
  title: "MARSU Roulette · Cryptita Gacha",
  description: "Create cards, spin the MARSU Roulette, and mint your winner on Base Sepolia."
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
