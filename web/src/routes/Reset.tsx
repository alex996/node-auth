import { useReducer } from "preact/hooks";
import type { JSX } from "preact/jsx-runtime";
import { useLocation, useSearchParams } from "wouter-preact";
import { ErrorList, getErrors, postJson } from "../api.js";
import { httpState, merger } from "../state.js";

const initState = {
  ...httpState,
  password: "",
  confirmation: "",
};

const Reset = () => {
  const [, navigate] = useLocation();
  const [params] = useSearchParams();
  const [state, dispatch] = useReducer(merger<typeof initState>, initState);

  const id = Number(params.get("id"));
  const token = params.get("token");

  if (!id || !token) return <p>Invalid link</p>;

  const handleInput = (e: JSX.TargetedInputEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    dispatch({ [name]: value });
  };

  const handleSubmit = async (e: JSX.TargetedSubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    dispatch({ loading: true, errors: [] });

    try {
      await postJson("/api/password/reset", {
        id,
        token,
        password: state.password,
      });

      navigate("/login");
    } catch (e) {
      dispatch({ loading: false, errors: await getErrors(e) });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        value={state.password}
        placeholder="Password"
        onInput={handleInput}
        name="password"
      />

      <input
        type="password"
        value={state.confirmation}
        placeholder="Confirm Password"
        onInput={handleInput}
        name="confirmation"
      />

      <button
        disabled={
          !state.password ||
          !state.confirmation ||
          state.password !== state.confirmation ||
          state.loading
        }
      >
        {state.loading ? "Loading..." : "Reset Password"}
      </button>

      <ErrorList errors={state.errors} />
    </form>
  );
};

export { Reset };
