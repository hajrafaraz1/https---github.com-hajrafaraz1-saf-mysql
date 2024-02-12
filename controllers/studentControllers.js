const { getConnection, connectToDatabase } = require("../db/config");

const _databaseExecution = async (query, data) => {
  return new Promise((resolve, reject) => {
    getConnection().query(query, data, (error, results, fields) => {
      if (error) {
        console.log("error", error);
        reject(error);
      } else {
        console.log("results", results);
        resolve(results);
      }
    });
  });
};
//fetching Data
const allStudentData = async (req, res) => {
  const query = `
    SELECT studentdata.id, studentdata.name, studentdata.gender, studentdata.place, GROUP_CONCAT(groups.group_names) AS groups
    FROM studentdata
    LEFT JOIN student_groups ON studentdata.id = student_groups.student_id
    LEFT JOIN groups ON student_groups.group_id = groups.id
    GROUP BY studentdata.id;
  `;

  const result = await _databaseExecution(query);
  return res.json(result);
};
// createstudent
const createStudent = async (req, res) => {
  const { name, gender, place, groups } = req.body;

  const insertStudentQuery = "INSERT INTO studentdata SET ?";
  const studentValues = { name, gender, place };

  try {
    const studentInsertResult = await _databaseExecution(
      insertStudentQuery,
      studentValues
    );
    const student_id = studentInsertResult.insertId;
  
    const groupInsertQuery = "INSERT INTO student_groups SET ?";
    const groupInsertPromises = groups.map(async (groupName) => {
      // Check if the group exists, and if not, insert it
      const group_id = await getOrCreategroup_id(groupName);

      // Insert the relationship in the junction table
      const student_groups = { student_id, group_id };
      return _databaseExecution(groupInsertQuery, student_groups);
    });

    // Execute all the group insert queries in parallel
    const groupInsertResults = await Promise.all(groupInsertPromises);

    return res.json({
      success: true,
      message: "Student and group relationships created successfully",
      student_id: student_id,
      groupInsertResults: groupInsertResults,
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ success: false, error: "Internal server error" });
  }
};

//here it is taking data and ids or making ids using group_names if not present
const getOrCreategroup_id = async (groupName) => {
  const checkGroupQuery = "SELECT id FROM groups WHERE group_names = ?";
  const existingGroup = await _databaseExecution(checkGroupQuery, groupName);

  if (existingGroup.length > 0) {
    return existingGroup[0].id;
  }
};

const deleteStudent = async (req, res) => {
  const stud_id = req.params.id;
  console.log("stud", stud_id);
  const query_StudentData = "DELETE FROM studentdata WHERE id=?";
  const result = await _databaseExecution(query_StudentData, stud_id);

  return res.json(result);
};

const updateStudent = async (req, res) => {
  const stud_id = req.params.id;
  const { name, gender, place, groups } = req.body;

  if (!stud_id) {
    return res
      .status(400)
      .json({ error: "Student ID is required for updating." });
  }

  try {
    //Stud_id is required to update on thebasis of id so it is needed
    const updateStudentQuery =
      "UPDATE studentdata SET name=?, gender=?, place=? WHERE id = ?";
    const studentValues = [name, gender, place, stud_id];
    await _databaseExecution(updateStudentQuery, studentValues);
    // here it is getting groups from frontend which were submitted
    // during Creating of Person
    const existingGroupsQuery =
      "SELECT group_id FROM student_groups WHERE student_id = ?";
    const existingGroupsResult = await _databaseExecution(
      existingGroupsQuery,
      stud_id
    );
    //making an array in which all created groups are adding
    const group_ids = await Promise.allSettled(groups.map(getOrCreategroup_id));
    console.log("Groups IDs: ", group_ids);
    const existingGroupIds = existingGroupsResult.map((row) => row.group_id);
    // Identify new groups to be added and existing groups to be removed
    const groupsToAdd = group_ids.filter(
      (groupId) => !existingGroupIds.includes(groupId.value)
    );

    console.log("Groups to Add: ", groupsToAdd);
    const groupsToRemove = existingGroupIds.filter(
      (groupId) => !group_ids.some((g) => g.value === groupId)
    );

    console.log("Groups to Remove: ", groupsToRemove);

    // if added then add in table
    if (groupsToAdd.length > 0) {
      const insertNewGroupQuery =
        "INSERT INTO student_groups (student_id, group_id) VALUES " +
        groupsToAdd.map(() => "(?, ?)").join(", ");
      const valuesToInsert = groupsToAdd.flatMap((group_id) => [
        stud_id,
        group_id.value,
      ]);
      await _databaseExecution(insertNewGroupQuery, valuesToInsert);
    }

    // Remove existing groups
    if (groupsToRemove.length > 0) {
      const deleteGroupsQuery =
        "DELETE FROM student_groups WHERE student_id = ? AND group_id IN (?)";
      await _databaseExecution(deleteGroupsQuery, [stud_id, groupsToRemove]);
    }

    return res.json({
      success: true,
      message: "Student record updated successfully.",
    });
  } catch (error) {
    console.error("Error in updating student:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = {
  allStudentData,
  createStudent,
  deleteStudent,
  updateStudent,
};
