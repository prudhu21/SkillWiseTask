const bcrypt = require('bcryptjs');
const demoPassword = 'password';
const demoHash = bcrypt.hashSync(demoPassword, 8);

const users = [
  {
    _id: '1',
    username: 'admin',
    passwordHash: demoHash,
    email: 'admin@example.com',
    role: 'admin'
  }
];

module.exports = {
  findOne: (filter) => {
    return {
      lean: async () => {
        if (!filter) return null;

        // Prefer explicit checks so callers can search by username or email
        if (filter.username) {
          const u = users.find(x => x.username === filter.username);
          return u ? { ...u } : null;
        }
        if (filter.email) {
          const u = users.find(x => x.email === filter.email);
          return u ? { ...u } : null;
        }
        if (filter.user) {
          const u = users.find(x => x.username === filter.user || x._id === filter.user);
          return u ? { ...u } : null;
        }
        // fallback: try to match any string value against username
        const val = Object.values(filter).find(v => typeof v === 'string');
        if (val) {
          const u = users.find(x => x.username === val || x.email === val || x._id === val);
          return u ? { ...u } : null;
        }
        return null;
      }
    };
  }
  ,
  create: async ({ username, password, role = 'user' }) => {
    const exists = users.find(u => u.username === username);
    if (exists) throw new Error('UserExists');
    const id = String(users.length + 1);
    const bcrypt = require('bcryptjs');
    const passwordHash = bcrypt.hashSync(password, 8);
    const u = { _id: id, username, passwordHash, role, email: (arguments[0] && arguments[0].email) || null };
    users.push(u);
    return { ...u };
  }
  ,
  // dev helper: list users (do not expose in production)
  listAll: () => users.map(u => ({ ...u }))
};
