const xlsx = require("xlsx")
const Expense = require("../models/expense");
const addExpense = async (req, res) => {
  try {
    const { icon, category, amount, date } = req.body;
    if (!category || !amount || !date) {
      return res.status(401).send({ message: "all fields are required" });
    }
    const newExpense = await Expense.create({
      userId: req.user._id,
      icon,
      category,
      amount,
      date: new Date(date),
    });

    res
      .status(201)
      .send({ message: "Expense created successfully", income: newExpense });
  } catch (err) {
    res.status(500).send({ message: "internal err", err: err.message });
  }
};
const getAllExpense = async (req, res) => {
   try{
     const userId = req.user._id
     const expense = await Expense.find({userId}).sort({date: -1});
     res.status(200).send({message : "expense ftech successfully", expense})

   }catch(err){
    res.status(403).send({message : "server error", err: err.message})
   }

};
const deleteExpense = async (req, res) => {
    try{
        await Expense.findByIdAndDelete(req.params.id)
        res.status(201).send({message : "expense deleted successfully"})

    }catch(err){
        res.status(200).send({message : "server err" , err: err.message})
    }
};
const downloadExpenseExcel = async (req, res) => {
    const userId = req.user._id;

    try {
        const expense = await Expense.find({ userId }).sort({ date: -1 });

        const data = expense.map((item) => ({
          Category: item.category,
          Amount: item.amount,
          Date: item.date ? new Date(item.date).toISOString().slice(0,10) : '',
          Icon: item.icon || ''
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, "Expense");

        const filename = "expense_details.xlsx"
        xlsx.writeFile(wb, filename);
        res.download(filename);

    } catch (err) {
        res.status(500).send({ message: "server error", err: err.message });
    }
};

module.exports = { downloadExpenseExcel, deleteExpense, getAllExpense, addExpense };
