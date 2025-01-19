// User log in and register
const users = []; // This is a simple in-memory user store

module.exports = {
  findUserByUsername: (username) => users.find(user => user.username === username),
  addUser: (user) => users.push(user),
};
