import "./app.css"
import { Toaster } from "@/components/ui/sonner";
import AuthBootstrap from "@/components/AuthBootstrap";
import AuthenticatedHeader from "@/components/AuthenticatedHeader";
import InvitationInbox from "@/components/InvitationInbox";

export const metadata = {
  title: "FlowBoard | Real-time collaborative Kanban",
  description: "Plan work together with live card updates, drag-and-drop boards, and role-based access.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/flowboard.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fira+Code&family=Inter:opsz,wght@14..32,100..900&family=Poppins:wght@300;400&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/svg+xml" href="/flowboard.svg" />
      </head>
      <body className="bg-background font-[Inter] text-sm text-foreground">
        <AuthBootstrap />
        <AuthenticatedHeader />
        {children}
        <InvitationInbox />
        <Toaster />
      </body>
    </html>
  );
}
