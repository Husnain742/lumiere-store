import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis"; // Aapka existing Upstash Redis client

// Create a new ratelimiter, that allows 5 requests per 60 seconds (1 minute) per IP
export const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"), // 1 minute mein sirf 5 requests allow karega
  analytics: true,
  prefix: "lumiere_ratelimit",
});