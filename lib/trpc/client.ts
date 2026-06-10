"use client";

import { createTRPCReact } from "@trpc/react-query";
import type { inferRouterOutputs, inferRouterInputs } from "@trpc/server";
import type { AppRouter } from "@/server/trpc/router";

export const trpc = createTRPCReact<AppRouter>();

export type RouterOutputs = inferRouterOutputs<AppRouter>;
export type RouterInputs = inferRouterInputs<AppRouter>;
