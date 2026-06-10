"use client";

import { useRouter } from "@/i18n/navigation";
import { trpc } from "@/lib/trpc/client";
import type { Asset } from "@/schema/types";

/**
 * Optimistic asset list + update mutation.
 * SSR data via initialItems, instant UI on change, background sync + status refresh.
 */
export function useOptimisticAssets(initialItems?: Asset[]) {
  const router = useRouter();
  const utils = trpc.useUtils();

  const { data: assets } = trpc.asset.list.useQuery(undefined, {
    initialData: initialItems,
  });

  const updateMut = trpc.asset.update.useMutation({
    onMutate: async (input) => {
      await utils.asset.list.cancel();
      const prev = utils.asset.list.getData();
      utils.asset.list.setData(undefined, (old) =>
        old?.map((a) => (a.id === input.id ? { ...a, ...input } : a)),
      );
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) utils.asset.list.setData(undefined, ctx.prev);
    },
    onSettled: () => {
      utils.asset.list.invalidate();
      router.refresh();
    },
  });

  return {
    items: assets ?? [],
    update: updateMut.mutate,
  };
}
