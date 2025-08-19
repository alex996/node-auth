import { useReducer } from "preact/hooks";
import { ErrorList, getErrors, postJson } from "./api.js";
import { httpState, merger } from "./state.js";

const initState = {
  ...httpState,
  resent: false,
};

const Banner = () => {
  const [state, dispatch] = useReducer(merger<typeof initState>, initState);

  const handleResend = async () => {
    dispatch({ loading: true, errors: [] });

    try {
      await postJson("/api/email/resend");

      dispatch({ loading: false, resent: true });
    } catch (e) {
      dispatch({ loading: false, errors: await getErrors(e) });
    }
  };

  return (
    <>
      <p>
        Check your inbox for a link to verify your account.{" "}
        {state.resent ? (
          "Email resent"
        ) : (
          <>
            Haven't received the email?{" "}
            <button onClick={handleResend} disabled={state.loading}>
              {state.loading ? "Loading..." : "Resend"}
            </button>
          </>
        )}
      </p>
      <ErrorList errors={state.errors} />
    </>
  );
};

export { Banner };
