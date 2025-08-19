import { useEffect, useState } from "preact/hooks";
import { Route, Switch } from "wouter-preact";
import { ErrorList, getErrors, getJson } from "./api.js";
import { Banner } from "./Banner.js";
import { Header } from "./Header.js";
import { AuthRoute, GuestRoute } from "./Route.js";
import { Login, Recover, Register, Reset, Verify } from "./routes/index.js";
import { useHttp, UserContext, type User } from "./state.js";

const App = () => {
  const userState = useState<User>();
  const [user, setUser] = userState;
  const auth = !!user;

  const [loading, setLoading, errors, setErrors] = useHttp(true);

  useEffect(() => {
    getJson("/api/me")
      .then(setUser)
      .catch(async (e) => {
        if (e instanceof Response && e.status === 401) {
          return; // not logged in
        } else {
          setErrors(await getErrors(e));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <UserContext.Provider value={userState}>
      {user && !user.verified_at && location.pathname !== "/email/verify" && (
        <Banner />
      )}

      <Header />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <Switch>
          <AuthRoute auth={auth} path="/">
            {() => <p>Hello, {user!.name}</p>}
          </AuthRoute>

          <GuestRoute auth={auth} path="/login" component={Login} />

          <GuestRoute auth={auth} path="/register" component={Register} />

          <AuthRoute auth={auth} path="/email/verify" component={Verify} />

          <GuestRoute auth={auth} path="/password/email" component={Recover} />

          <GuestRoute auth={auth} path="/password/reset" component={Reset} />

          <Route>404 Not Found</Route>
        </Switch>
      )}

      <ErrorList errors={errors} />
    </UserContext.Provider>
  );
};

export { App };
