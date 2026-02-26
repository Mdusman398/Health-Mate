const User = require("../models/User");
const Income = require("../models/income");
const Expense = require("../models/expense");

const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId );
    const income = await Income.find({ userId });
    const expense = await Expense.find({ userId });
    const totalIncome = income.reduce((acc, item) => acc + item.amount , 0);
    const totalExpense = expense.reduce((acc, item) => acc + item.amount ,0);
    const balance = totalIncome - totalExpense;
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // is month wala
    const monthlyIncome = income
      .filter(
        (i) =>
          new Date(i.date).getMonth() === currentMonth &&
          new Date(i.date).getFullYear() === currentYear,
      )
      .reduce((acc, item) => acc + item.amount , 0);

    const monthlyExpense = expense
      .filter(
        (i) =>
          new Date(i.date).getMonth() === currentMonth &&
          new Date(i.date).getFullYear() === currentYear,
      )
      .reduce((acc, item) => acc + item.amount , 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const lastSevenDaysExpense = expense
      .filter((e) => new Date(e.date) >= sevenDaysAgo)
      .reduce((acc, item) => acc + item.amount , 0);

      const allTransactions = [
        ...income.map(i => ({type: "income" , ...i._doc})),
        ...expense.map(e => ({type :"expense", ...e._doc}))
      ]
      .sort((a ,b) => new Date(b.date) - new Date(a.date))
      .slice(0, 10)

      res.status(200).send({
        message : "dashboard data fetched successfully",
        user,
        summary:{
          userId,
          user,
          income,
          expense,
          totalIncome,
          totalExpense,
          totalbalance : balance,
          monthlyIncome,
          monthlyExpense,
          lastSevenDaysExpense,
          allTransactions
        }
      })
  } catch (err) {
    res.status(500).send({ message: "server error", err: err.message });
  }
};

module.exports = {getDashboard}
