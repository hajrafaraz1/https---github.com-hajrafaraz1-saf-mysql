const express = require("express");
const {
  allStudentData,
  createStudent,
  deleteStudent,
  updateStudent,
} = require("../controllers/studentControllers");

const router = express.Router();

router.get("/", allStudentData);
// //POST a new Student
router.post("/", createStudent);
// //DELETE a Student
router.delete("/:id", deleteStudent);
// //UPDATE a Student
router.patch("/:id", updateStudent);
module.exports = router;
