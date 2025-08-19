import { createContext } from "preact";
import { useContext, useState } from "preact/hooks";

export const httpState = {
  loading: false,
  errors: [] as string[], // components are sharing this by reference; should be OK as long as they don't mutate it
};

export const merger = <S,>(prev: S, next: Partial<S>) => ({
  ...prev,
  ...next,
});

// useState calls are batched, at least in React.
// https://github.com/reactwg/react-18/discussions/21
export function useHttp(loading = false) {
  const loadingState = useState(loading);
  const errorsState = useState<string[]>([]);

  return [...loadingState, ...errorsState] as const;
}

export const UserContext = createContext<ReturnType<typeof useState<User>>>([
  undefined,
  () => {},
]);

export const useUser = () => useContext(UserContext);

// FIXME tRPC? separate package with types?
// A common problem is when you add a column to your query,
// this type doesn't update automatically, because
// it's not inferred from the API response.
export interface User {
  id: number;
  name: string;
  email: string;
  verified_at: number | null;
}
