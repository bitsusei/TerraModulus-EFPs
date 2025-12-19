import { untrack } from "svelte";

/** Source: https://github.com/sveltejs/svelte/issues/9248#issuecomment-1732246774 */
export function explicitEffect(fn: () => void, depsFn: () => any[]) {
  $effect(() => {
    depsFn();
    untrack(fn);
  });
}
