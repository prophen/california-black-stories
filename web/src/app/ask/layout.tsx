import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ask California Black Stories",
  description:
    "Ask questions about Black history in California. Answers come only from the California Black Stories knowledge base, with sources.",
};

export default function AskLayout({ children }: { children: React.ReactNode }) {
  return children;
}
