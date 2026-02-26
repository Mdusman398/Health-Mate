const express = require("express")
const router = express.Router()
const {addExpense, getAllExpense, deleteExpense,downloadExpenseExcel} = require("../controller/expenseController")
const auth = require("../middleware/authMiddleware")
router.post("/add" ,auth, addExpense)
router.get("/get" ,auth, getAllExpense)
router.delete("/delete/:id",auth , deleteExpense)
router.get("/downloadexcel" ,auth, downloadExpenseExcel)
module.exports = router