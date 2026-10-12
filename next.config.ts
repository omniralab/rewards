import type { NextConfig } from "next";

// W odróżnieniu od Control Tower to jest POJEDYNCZA aplikacja, nie workspaces,
// więc `outputFileTracingRoot` nie jest potrzebny - standalone widzi swoje
// node_modules piętro wyżej niż `.next`, czyli w katalogu projektu.
const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
