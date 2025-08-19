import { useEffect } from "preact/hooks";
import { ErrorList, getErrors, postJson } from "../api.js";
import { useHttp, useUser } from "../state.js";

const Verify = () => {
  const [user, setUser] = useUser();
  if (!user) throw new Error("unreachable");

  const [loading, setLoading, errors, setErrors] = useHttp(true);

  useEffect(() => {
    if (user.verified_at) return;

    const params = new URLSearchParams(location.search);
    const expiredAt = Number(params.get("expiredAt"));
    const signature = params.get("signature");

    if (expiredAt && signature) {
      setLoading(true);
      setErrors([]);

      postJson("/api/email/verify", { expiredAt, signature })
        .then((verified_at) => {
          setUser((u) => ({ ...u!, verified_at }));
        })
        .catch(async (e) => setErrors(await getErrors(e)))
        .finally(() => setLoading(false));
    }
  }, []);

  if (user.verified_at) {
    return <p>Your email is verified. Thank you.</p>;
  }

  if (loading) return <p>Loading...</p>;

  if (errors.length) return <ErrorList errors={errors} />;

  return <p>The link is invalid.</p>;
};

export { Verify };
