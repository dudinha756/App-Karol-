import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Forma day — Nutrição, treino e evolução",
  description: "Organize alimentação, treinos, agenda e progresso em uma experiência simples e leve."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
