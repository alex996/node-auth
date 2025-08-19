import { useReducer } from "preact/hooks";
import type { JSX } from "preact/jsx-runtime";
import { Link, useLocation } from "wouter-preact";
import { ErrorList, getErrors, postJson } from "../api.js";
import { httpState, merger, useUser } from "../state.js";

const initState = {
  ...httpState,
  name: "",
  email: "",
  password: "",
};

const Register = () => {
  const [, navigate] = useLocation();
  const [, setUser] = useUser();
  const [state, dispatch] = useReducer(merger<typeof initState>, initState);

  const handleInput = (e: JSX.TargetedInputEvent<HTMLInputElement>) => {
    const { name, value } = e.currentTarget;
    dispatch({ [name]: value });
  };

  const handleSubmit = async (e: JSX.TargetedSubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    dispatch({ loading: true, errors: [] });

    try {
      const user = await postJson("/api/register", {
        name: state.name,
        email: state.email,
        password: state.password,
      });

      setUser(user);

      navigate("/");
    } catch (e) {
      dispatch({ loading: false, errors: await getErrors(e) });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={state.name}
        placeholder="Name"
        onInput={handleInput}
        name="name"
      />

      <input
        type="email"
        value={state.email}
        placeholder="Email"
        onInput={handleInput}
        name="email"
      />

      <input
        type="password"
        value={state.password}
        placeholder="Password"
        onInput={handleInput}
        name="password"
      />

      <button
        disabled={
          !state.name || !state.email || !state.password || state.loading
        }
      >
        {state.loading ? "Loading..." : "Register"}
      </button>

      <ErrorList errors={state.errors} />

      <p>
        Already have an account? <Link href="/login">Log In</Link>
      </p>
    </form>
  );
};

export { Register };
