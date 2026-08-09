import { Suspense } from "react";
import { ActivateView } from "./activate-view";

export default function ActivatePage() {
  return (
    <Suspense fallback={null}>
      <ActivateView />
    </Suspense>
  );
}
