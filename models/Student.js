const Student = {
  id: {
    type: Number,
    primaryKey: true,
  },
  name: {
    type: String,
    required: true,
  },
  gender: {
    type: String,
    required: true,
  },
  place: {
    type: String,
    required: true,
  },
  groups: {
    type: [String],
    required: true,
  },
};

module.exports = Student;
