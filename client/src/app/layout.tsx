import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'FilmiGuess — Guess the Indian Cinema Star',
  description: 'Play the ultimate Indian cinema guessing game with friends! Guess Bollywood actors, Hindi movies, South Indian stars and more. Free multiplayer game — no signup needed.',
  keywords: 'bollywood quiz, indian cinema game, guess the actor, hindi movie quiz, multiplayer guessing game, bollywood game online',
  openGraph: {
    title: 'FilmiGuess — Indian Cinema Guessing Game',
    description: 'Guess Bollywood actors & movies with friends in real time!',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
