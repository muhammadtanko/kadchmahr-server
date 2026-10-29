const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.get("/", authMiddleware, async (req, res) => {
    const result = await transactionController.getTransactions();
    return res.status(result.ok ? 200 : 400).json(result);
});

router.put("/:id", authMiddleware, async (req, res) => {
    const result = await transactionController.updateTransaction(req.params.id, req.body);
    return res.status(result.ok ? 200 : 400).json(result);
});

module.exports = router;
