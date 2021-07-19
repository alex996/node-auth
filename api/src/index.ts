import { app } from "./app";
import { APP_PORT, APP_ORIGIN } from "./config";

app.listen(APP_PORT, () => console.log(APP_ORIGIN));
