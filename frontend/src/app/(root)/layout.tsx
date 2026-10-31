import Providers from "@/providers/Providers";

export default function RootGroupLayout({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}
