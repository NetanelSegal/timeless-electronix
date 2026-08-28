import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

// Listen first, connect second. If Mongo is unreachable at boot the process
// must still bind the port, otherwise the Apache proxy in front of it serves
// 503 for the whole site — including every product page.
app.listen(env.PORT, () => {
  console.log(`Server running on port ${env.PORT}`);
});

void connectDB();
