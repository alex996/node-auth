import { useReducer } from "preact/hooks";
import type { JSX } from "preact/jsx-runtime";
import { ErrorList, getErrors, postJson } from "../api.js";
import { httpState, merger } from "../state.js";

const initState = {
  ...httpState,
  email: "",
  sentTo: "",
};

const Recover = () => {
  const [state, dispatch] = useReducer(merger<typeof initState>, initState);

  const handleEmail = (e: JSX.TargetedInputEvent<HTMLInputElement>) => {
    dispatch({ email: e.currentTarget.value });
  };

  const handleSubmit = async (e: JSX.TargetedSubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    dispatch({ loading: true, errors: [] });

    try {
      await postJson("/api/password/email", { email: state.email });

      dispatch({ ...initState, sentTo: state.email });
    } catch (e) {
      dispatch({ loading: false, errors: await getErrors(e) });
    }
  };

  const handleReset = () => {
    dispatch({ sentTo: "" });
  };

  return state.sentTo ? (
    <>
      <p>
        Email sent to {state.sentTo}. Haven't received the email?{" "}
        <button onClick={handleReset}>Try again</button>
      </p>
    </>
  ) : (
    <form onSubmit={handleSubmit}>
      <p>We'll send you an email with a link to reset your password.</p>

      <input
        type="email"
        value={state.email}
        placeholder="Email"
        onInput={handleEmail}
      />

      <button disabled={!state.email || state.loading}>Send</button>

      <ErrorList errors={state.errors} />
    </form>
  );
};

export { Recover };
