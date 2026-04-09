import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import app from "./app.js";

async function start() {
  await connectDB();
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}

start();
