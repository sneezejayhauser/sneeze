import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Signal — news.cjhauser.me",
  description: "Clarity in the noise. Ad-free forever.",
};

export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
