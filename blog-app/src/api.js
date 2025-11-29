import axios from "axios";
const api = axios.create({ baseURL: "http://localhost:3000" });

export default {
  // Auth cơ bản (JSON Server không có auth thật; ta “giả lập” theo phạm vi môn)
  async login(email, password) {
    const { data } = await api.get("/users", { params: { email, password } });
    if (data.length) return data[0];
    throw new Error("Email/mật khẩu không đúng");
  },
  async register(payload) {
    const { data } = await api.post("/users", payload);
    return data;
  },

  // Posts
  listPosts(params = {}) {
    return api.get("/posts", { params }); // _page, _limit, _sort, _order
  },
  getPost(id) {
    return api.get(`/posts/${id}`);
  },
  createPost(payload) {
    return api.post("/posts", payload);
  },
  updatePost(id, payload) {
    return api.put(`/posts/${id}`, payload);
  },
  deletePost(id) {
    return api.delete(`/posts/${id}`);
  },

  // Comments
  listComments(postId) {
  return api.get('/comments', {
    params: { postId, _sort: 'createdAt', _order: 'desc', _expand: 'user' }
  });
},
  createComment(payload) {
    return api.post("/comments", payload);
  },

  // Users
  listUsers() {
    return api.get("/users");
  },

  updateUser(id, payload) {
  // dùng PATCH để chỉ cập nhật field intro, không ghi đè toàn bộ user
  return api.patch(`/users/${id}`, payload);
},

  // Messages
  listMessages() {
    return api.get("/messages", {
      params: { _sort: 'createdAt', _order: 'asc' }
    });
  },
  createMessage(payload) {
    return api.post("/messages", payload);
  },

};

