import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ products: [], total: 0, page: 1, totalPages: 0 });
});

export default router;
