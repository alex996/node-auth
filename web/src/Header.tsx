import { Link, useLocation } from "wouter-preact";
import { ErrorList, getErrors, postJson } from "./api.js";
import { useHttp, useUser } from "./state.js";

const Header = () => {
  const [, navigate] = useLocation();
  const [user, setUser] = useUser();
  const [loading, setLoading, errors, setErrors] = useHttp();

  const handleLogOut = async () => {
    setLoading(true);
    setErrors([]);

    try {
      await postJson("/api/logout");

      setUser(undefined);

      navigate("/login");
    } catch (e) {
      setErrors(await getErrors(e));
    }

    setLoading(false);
  };

  return (
    <>
      <header>
        {user ? (
          <p>
            <Link href="/login">Home</Link>{" "}
            <button onClick={handleLogOut} disabled={loading}>
              {loading ? "Loading..." : "Log Out"}
            </button>
          </p>
        ) : (
          <p>
            <Link href="/login">Log In</Link>{" "}
            <Link href="/register">Register</Link>
          </p>
        )}
      </header>
      <ErrorList errors={errors} />
    </>
  );
};

export { Header };
