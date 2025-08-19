import type { FunctionComponent } from "preact";
import { Redirect, Route, type RouteProps } from "wouter-preact";

interface Props extends RouteProps {
  auth: boolean;
}

const AuthRoute: FunctionComponent<Props> = ({ auth, ...rest }) => {
  if (auth) return <Route {...rest} />;

  return <Redirect to="/login" />;
};

const GuestRoute: FunctionComponent<Props> = ({ auth, ...rest }) => {
  if (auth) return <Redirect to="/" />;

  return <Route {...rest} />;
};

export { AuthRoute, GuestRoute };
