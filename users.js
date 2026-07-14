// ===== STUDENT USER DATA — users.js =====
const users = {
  "202501040436": {
    name: "Darshan Bari",
    department: "Computer Engineering",
    semester: "2nd",
    issuedBooks: [
      { title: "Python Crash Course", returnDate: "2026-05-10", rack: "A1" },
      { title: "Hands-On Machine Learning", returnDate: "2026-04-25", rack: "B1" },
      { title: "Clean Code", returnDate: "2026-05-20", rack: "F1" }
    ]
  },
  "202501040435": {
    name: "Aarsh Joshi",
    department: "Computer Engineering",
    semester: "2nd",
    issuedBooks: [
      { title: "HTML & CSS: Design and Build Websites", returnDate: "2026-04-28", rack: "A4" },
      { title: "Eloquent JavaScript", returnDate: "2026-05-12", rack: "A4" }
    ]
  },
  "202501040460": {
    name: "Tejas Bhadait",
    department: "Computer Engineering",
    semester: "2nd",
    issuedBooks: [
      { title: "Deep Learning", returnDate: "2026-04-20", rack: "C2" },
      { title: "Pattern Recognition and ML", returnDate: "2026-05-05", rack: "B2" },
      { title: "Artificial Intelligence: A Modern Approach", returnDate: "2026-05-18", rack: "C1" },
      { title: "Linear Algebra and Its Applications", returnDate: "2026-04-15", rack: "F3" }
    ]
  },
  "202501120008": {
    name: "Jayesh Wakade",
    department: "Data Science",
    semester: "2nd",
    issuedBooks: [
      { title: "R for Data Science", returnDate: "2026-05-22", rack: "D1" },
      { title: "Practical Statistics for Data Scientists", returnDate: "2026-05-08", rack: "D2" }
    ]
  },
  "202501041156": {
    name: "Vikram Joshi",
    department: "Computer Engineering",
    semester: "8th",
    issuedBooks: [
      { title: "Introduction to Algorithms", returnDate: "2026-05-15", rack: "E1" },
      { title: "Database System Concepts", returnDate: "2026-04-30", rack: "E3" },
      { title: "Operating System Concepts", returnDate: "2026-05-25", rack: "E2" }
    ]
  },
  "202501120022": {
    name: "Shahavej Khadke",
    department: "Data Science",
    semester: "2nd",
    issuedBooks: [
      { title: "The Hundred-Page Machine Learning Book", returnDate: "2026-05-14", rack: "B1" },
      { title: "Deep Learning with Python", returnDate: "2026-04-22", rack: "C2" },
      { title: "Natural Language Processing with Python", returnDate: "2026-05-30", rack: "C3" }
    ]
  },
  "202501120024": {
    name: "Varad Chavhan",
    department: "Data Science",
    semester: "2nd",
    issuedBooks: [
      { title: "MongoDB: The Definitive Guide", returnDate: "2026-05-03", rack: "E3" },
      { title: "Docker Deep Dive", returnDate: "2026-05-19", rack: "E4" }
    ]
  },
  "202501120023": {
    name: "Vedant Rothe",
    department: "Data Science",
    semester: "2nd",
    issuedBooks: [
      { title: "Cracking the Coding Interview", returnDate: "2026-05-11", rack: "E1" },
      { title: "Grokking Algorithms", returnDate: "2026-04-18", rack: "E1" },
      { title: "The Pragmatic Programmer", returnDate: "2026-05-28", rack: "F1" }
    ]
  }
};

// All valid PRNs for demo selection
const allPRNs = Object.keys(users);
