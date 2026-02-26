const xlsx = require("xlsx")
const Income = require("../models/income");
const addIncome = async (req, res) => {
  try {
    const { icon, source, amount, date } = req.body;
    if (!source || !amount || !date) {
      return res.status(401).send({ message: "all fields are required" });
    }
    const newIncome = await Income.create({
      userId: req.user._id,
      icon,
      source,
      amount,
      date: new Date(date),
    });

    res
      .status(201)
      .send({ message: "income created successfully", income: newIncome });
  } catch (err) {
    res.status(500).send({ message: "internal err", err: err.message });
  }
};
const getAllIncome = async (req, res) => {
   try{
     const userId = req.user._id
     const income = await Income.find({userId}).sort({date: -1});
     res.status(200).send({message : "income ftech successfully", income})

   }catch(err){
    res.status(403).send({message : "server error", err: err.message})
   }

};
const deleteIncome = async (req, res) => {
    try{
        await Income.findByIdAndDelete(req.params.id)
        res.status(201).send({message : "income deleted successfully"})

    }catch(err){
        res.status(200).send({message : "server err" , err: err.message})
    }
};
const downloadIncomeExcel = async (req, res) => {
    const userId = req.user._id;

    try {
        const income = await Income.find({ userId }).sort({ date: -1 });

        const data = income.map((item) => ({
          Source: item.source,
          Amount: item.amount,
          Date: item.date ? new Date(item.date).toISOString().slice(0,10) : '',
          Icon: item.icon || ''
        }));

        const wb = xlsx.utils.book_new();
        const ws = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(wb, ws, "Income");

        const filename = "income_details.xlsx"
        xlsx.writeFile(wb, filename);
        res.download(filename);

    } catch (err) {
        res.status(500).send({ message: "server error", err: err.message });
    }
};

module.exports = { downloadIncomeExcel, deleteIncome, getAllIncome, addIncome };
