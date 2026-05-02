import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatWidget } from "@/components/site/ChatWidget";

import appCss from "../styles.css?url";

interface RouterContext {
  queryClient: QueryClient;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          My-Sea International
        </p>
        <h1 className="mt-6 font-display text-7xl text-primary">404</h1>
        <h2 className="mt-4 font-display text-2xl">This page is uncharted</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium tracking-wide text-primary-foreground transition-smooth hover:bg-primary/90"
          >
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "My-Sea International — Stationery Import & Export" },
      {
        name: "description",
        content:
          "Global stationery import and export. Premium journals, writing instruments, paper goods, and sealing wax shipped worldwide.",
      },
      { property: "og:title", content: "My-Sea International — Stationery Import & Export" },
      {
        property: "og:description",
        content:
          "Global stationery import and export — sourcing, freight, and B2B distribution worldwide.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "My-Sea International — Stationery Import & Export" },
      { name: "description", content: "Blueprint Commerce is a full-stack e-commerce platform for stationery import/export." },
      { property: "og:description", content: "Blueprint Commerce is a full-stack e-commerce platform for stationery import/export." },
      { name: "twitter:description", content: "Blueprint Commerce is a full-stack e-commerce platform for stationery import/export." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/369dff6f-3b99-421c-b2ee-968cd70f81c7/id-preview-64d34b0d--50f7746e-94ae-4c70-8e99-7530b26de3a4.lovable.app-1777733848091.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/369dff6f-3b99-421c-b2ee-968cd70f81c7/id-preview-64d34b0d--50f7746e-94ae-4c70-8e99-7530b26de3a4.lovable.app-1777733848091.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Outlet />
          <ChatWidget />
          <Toaster />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
