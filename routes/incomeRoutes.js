const express = require("express")
const router = express.Router()
const {addIncome, getAllIncome, deleteIncome,downloadIncomeExcel} = require("../controller/incomeController")
const auth = require("../middleware/authMiddleware")
router.post("/add" ,auth, addIncome)
router.get("/get" ,auth, getAllIncome)
router.delete("/delete/:id",auth , deleteIncome)
router.get("/downloadexcel" ,auth, downloadIncomeExcel)
module.exports = router