const express = require("express");
const router = express.Router();
const accountController = require("../controllers/account.controller");
const transactionController = require("../controllers/transaction.controller");
const authMiddleware = require("../middlewares/auth.middleware");

router.post("/", authMiddleware, async (req, res) => {
    const result = await accountController.addAccount(req.body);
    return res.status(result.ok ? 201 : 400).json(result);
});

router.get("/", authMiddleware, async (req, res) => {
    const result = await accountController.getAccounts();
    return res.status(result.ok ? 200 : 400).json(result);
});

router.get("/:id", authMiddleware, async (req, res) => {
    const result = await accountController.getAccountById(req.params.id);
    return res.status(result.ok ? 200 : 404).json(result);
});

router.put("/:id", authMiddleware, async (req, res) => {
    const result = await accountController.updateAccount(req.params.id, req.body);
    return res.status(result.ok ? 200 : 400).json(result);
});

router.delete("/:id", authMiddleware, async (req, res) => {
    const result = await accountController.deleteAccount(req.params.id);
    return res.status(result.ok ? 200 : 400).json(result);
});

router.post("/:id/debit", authMiddleware, async (req, res) => {
    const result = await transactionController.debitAccount({ accountId: req.params.id, ...req.body });
    return res.status(result.ok ? 200 : 400).json(result);
});

router.post("/:id/credit", authMiddleware, async (req, res) => {
    const result = await transactionController.creditAccount({ accountId: req.params.id, ...req.body });
    return res.status(result.ok ? 200 : 400).json(result);
});

module.exports = router;
