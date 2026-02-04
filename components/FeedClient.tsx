"use client";

import { useState } from "react";
import { FeedTabs, FeedTab } from "@/components/FeedTabs";
import { PostComposer } from "@/components/PostComposer";
import { FeedView } from "@/components/FeedView";

export function FeedClient() {
  const [feed, setFeed] = useState<FeedTab>("main");
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <div>
        <FeedTabs value={feed} onChange={setFeed} />
      </div>
      <PostComposer onPosted={() => setRefreshKey((value) => value + 1)} />
      <div key={refreshKey}>
        <FeedView feed={feed} />
      </div>
    </div>
  );
}
