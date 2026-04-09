import { vi, beforeAll, afterAll, afterEach } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

vi.stubEnv("MONGODB_URI", "mongodb://localhost:27017/test");
vi.stubEnv("ADMIN_SECRET", "test-secret");
vi.stubEnv("JWT_SECRET", "test-jwt-secret");
vi.stubEnv("PORT", "3099");
vi.stubEnv("CLIENT_URL", "http://localhost:5173");
vi.stubEnv("CLOUDINARY_CLOUD_NAME", "");
vi.stubEnv("CLOUDINARY_API_KEY", "");
vi.stubEnv("CLOUDINARY_API_SECRET", "");
vi.stubEnv("RESEND_API_KEY", "");
vi.stubEnv("NOTIFICATION_EMAIL", "test@test.com");

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key]!.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
