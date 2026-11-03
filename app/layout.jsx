import "../web/style.css";
import "../web/editor.css";

export const metadata = {
  title: "Rarity Roulette · Cryptita Gacha",
  description: "Create cards, spin a rarity roulette, and mint your winner on BNB Smart Chain Testnet."
};

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
