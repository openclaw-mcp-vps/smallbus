import dynamic from "next/dynamic";

import type { RouteStop } from "@/lib/database";

const RouteMapClient = dynamic(() => import("@/components/RouteMapClient"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[360px] items-center justify-center rounded-xl border border-border bg-card text-sm text-muted-foreground">
      Loading route map...
    </div>
  ),
});

type RouteMapProps = {
  stops: RouteStop[];
  routeName: string;
};

export default function RouteMap(props: RouteMapProps) {
  return <RouteMapClient {...props} />;
}
