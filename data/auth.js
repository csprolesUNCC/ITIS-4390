 
   //Simple localStorage account system 
  //  seed from /data/users.json.


const Auth = (function () {
  const USERS_KEY = 'wfUsers';
  const CURRENT_KEY = 'wfCurrentUser';

  function loadUsers() {
    try {
      const raw = localStorage.getItem(USERS_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function findUser(email) {
    const users = loadUsers();
    return users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  function createUser({ email, password, dob }) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const existing = findUser(email);
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const users = loadUsers();
    const newUser = {
      id: Date.now(),
      email,
      password,
      dob: dob || null,
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    saveUsers(users);
    setCurrentUser(newUser.id);
    return newUser;
  }

  function login(email, password) {
    const user = findUser(email);
    if (!user || user.password !== password) {
      throw new Error('Invalid email or password.');
    }
    setCurrentUser(user.id);
    return user;
  }

  function setCurrentUser(id) {
    localStorage.setItem(CURRENT_KEY, String(id));
  }

  function getCurrentUser() {
    const raw = localStorage.getItem(CURRENT_KEY);
    if (!raw) return null;
    const id = Number(raw);
    return loadUsers().find(u => u.id === id) || null;
  }

  function logout() {
    localStorage.removeItem(CURRENT_KEY);
  }

  // Seed from /data/users.json if wfUsers is empty.
  async function seedFromJSONIfEmpty() {
    const existing = loadUsers();
    if (existing.length > 0) {
      console.log('[Auth] Users already exist in localStorage, skipping seed.');
      return;
    }

    try {
      const res = await fetch('/data/users.json');
      if (!res.ok) {
        console.error('[Auth] Failed to load /data/users.json', res.status);
        return;
      }
      const json = await res.json();

      const now = new Date().toISOString();
      const sourceUsers = Array.isArray(json.users) ? json.users : [];

      const adapted = sourceUsers.map(u => ({
        id: u.id,
        email: u.email,
        password: u.password || 'password123', // default password
        name: u.name || '',
        created_at: now,
        json_user_data: u
      }));

      saveUsers(adapted);
      console.log('[Auth] Seeded users from users.json:', adapted);
    } catch (err) {
      console.error('[Auth] Error seeding from users.json:', err);
    }
  }

  return {
    loadUsers,
    createUser,
    login,
    getCurrentUser,
    logout,
    seedFromJSONIfEmpty
  };
})();
