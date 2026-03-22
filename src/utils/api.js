const API_BASE_URL = 'http://localhost:3000/api';

// 获取存储的token
const getToken = () => sessionStorage.getItem('token');

// 创建带有认证的请求头
const getAuthHeaders = () => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// 通用请求方法
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // 处理401未授权错误
      if (response.status === 401) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = '/login';
      }
      throw new Error(data.message || '请求失败');
    }

    // 统一返回数据格式
    if (data.success !== undefined) {
      return data.success ? data : data;
    }

    return data;
  } catch (error) {
    console.error('API请求错误:', error);
    throw error;
  }
};

// 认证API
export const authAPI = {
  login: (credentials) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  }),

  register: (userData) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),

  getCurrentUser: () => request('/auth/me'),

  logout: () => request('/auth/logout', { method: 'POST' }),

  changePassword: (passwords) => request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(passwords)
  })
};

// 公告API
export const announcementAPI = {
  getList: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/announcements?${query}`);
  },

  getDetail: (id) => request(`/announcements/${id}`),

  create: (data) => request('/announcements', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  update: (id, data) => request(`/announcements/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  delete: (id) => request(`/announcements/${id}`, { method: 'DELETE' })
};

// 任务API
export const taskAPI = {
  getList: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/tasks?${query}`);
  },

  getDetail: (id) => request(`/tasks/${id}`),

  create: (data) => request('/tasks', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  update: (id, data) => request(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  delete: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  getStatistics: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/tasks/statistics/summary?${query}`);
  }
};

// 考勤API
export const attendanceAPI = {
  getList: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/attendance?${query}`);
  },

  clockIn: (data) => request('/attendance/clock', {
    method: 'POST',
    body: JSON.stringify({ ...data, type: 'in' })
  }),

  clockOut: (data) => request('/attendance/clock', {
    method: 'POST',
    body: JSON.stringify({ ...data, type: 'out' })
  }),

  getStatistics: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/attendance/statistics?${query}`);
  }
};

// 员工API
export const employeeAPI = {
  getList: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/employees?${query}`);
  },

  getDetail: (id) => request(`/employees/${id}`),

  create: (data) => request('/employees', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  update: (id, data) => request(`/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  delete: (id) => request(`/employees/${id}`, { method: 'DELETE' })
};

// 部门API
export const departmentAPI = {
  getList: () => request('/departments'),

  getDetail: (id) => request(`/departments/${id}`),

  create: (data) => request('/departments', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  update: (id, data) => request(`/departments/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  delete: (id) => request(`/departments/${id}`, { method: 'DELETE' })
};

// 职位API
export const positionAPI = {
  getList: () => request('/positions'),

  getDetail: (id) => request(`/positions/${id}`),

  create: (data) => request('/positions', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  update: (id, data) => request(`/positions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  delete: (id) => request(`/positions/${id}`, { method: 'DELETE' })
};

// 工资API
export const salaryAPI = {
  getList: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/salaries?${query}`);
  },

  getDetail: (id) => request(`/salaries/${id}`),

  create: (data) => request('/salaries', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  update: (id, data) => request(`/salaries/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),

  delete: (id) => request(`/salaries/${id}`, { method: 'DELETE' }),

  batchGenerate: (data) => request('/salaries/batch-generate', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  getStatistics: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/salaries/statistics/summary?${query}`);
  }
};

// 消息API
export const messageAPI = {
  // 发送消息
  send: (data) => request('/messages', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // 获取与某用户的消息记录
  getMessages: (userId) => request(`/messages/${userId}`),

  // 获取对话列表
  getConversations: () => request('/messages'),

  // 获取通讯录列表
  getContacts: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/messages/contacts/all?${query}`);
  },

  // 标记消息为已读
  markAsRead: (messageId) => request(`/messages/${messageId}/read`, {
    method: 'PUT'
  }),

  // 获取未读消息数量
  getUnreadCount: () => request('/messages/unread/count'),

  // 删除消息
  delete: (messageId) => request(`/messages/${messageId}`, { method: 'DELETE' })
};

// 获取当前用户员工信息
export const getCurrentEmployee = async () => {
  try {
    const data = await request('/employees/current');
    return data.data || data;
  } catch (error) {
    console.error('获取员工信息失败:', error);
    return null;
  }
};

export default {
  auth: authAPI,
  announcement: announcementAPI,
  task: taskAPI,
  attendance: attendanceAPI,
  employee: employeeAPI,
  department: departmentAPI,
  position: positionAPI,
  salary: salaryAPI,
  message: messageAPI
};
