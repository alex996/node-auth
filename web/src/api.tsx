import type { FunctionComponent } from "preact";

export async function postJson(
  url: string,
  body?: unknown,
  init?: RequestInit
) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : null,
    credentials: "include",
    ...init,
  });
  if (!res.ok) throw res;
  return res.json();
}

export async function getJson(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    credentials: "include",
    ...init,
  });
  if (!res.ok) throw res;
  return res.json();
}

interface ErrorListProps {
  errors: string[];
}
// TODO You may want a floating toast message.
export const ErrorList: FunctionComponent<ErrorListProps> = ({ errors }) =>
  errors.length > 0 && (
    <ul>
      {errors.map((err, idx) => (
        <li key={idx}>{err}</li>
      ))}
    </ul>
  );

export async function getErrors(e: unknown) {
  if (e instanceof Response) {
    const json = await e.json();

    if (json.message) return [json.message as string];

    if (json._errors) {
      const errors: string[] = [];
      deepIterate(json, (key, val) => {
        if (key === "_errors" && Array.isArray(val)) {
          errors.push(...val);
        }
      });
      return errors;
    }
  }
  return ["Something went wrong"];
}

// https://stackoverflow.com/a/55764331
function deepIterate(
  obj: POJO,
  handler: (key: string, value: unknown) => void
) {
  // The only input is JSON, so we don't need to check hasOwnProperty().
  for (const key in obj) {
    if (isPOJO(obj[key])) {
      deepIterate(obj[key], handler);
    } else {
      handler(key, obj[key]);
    }
  }
}

// https://stackoverflow.com/a/69745650
const isPOJO = (value: unknown): value is POJO => value?.constructor === Object;

type POJO = Record<string, unknown>;
