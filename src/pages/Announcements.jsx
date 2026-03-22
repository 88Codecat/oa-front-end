import { useState, useEffect } from 'react';
import { announcementAPI } from '../utils/api';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    status: 'draft'
  });

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await announcementAPI.getList({ status: 'published' });
      setAnnouncements(data.data || []);
    } catch (error) {
      console.error('加载公告失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = {
        ...formData,
        publish_date: formData.status === 'published' ? new Date().toISOString() : null
      };

      if (editingAnnouncement) {
        await announcementAPI.update(editingAnnouncement.id, dataToSubmit);
      } else {
        await announcementAPI.create(dataToSubmit);
      }
      setShowModal(false);
      setEditingAnnouncement(null);
      resetForm();
      loadAnnouncements();
    } catch (error) {
      console.error('保存公告失败:', error);
      alert('保存失败: ' + error.message);
    }
  };

  const handleEdit = (announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      status: announcement.status
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个公告吗?')) return;
    try {
      await announcementAPI.delete(id);
      loadAnnouncements();
    } catch (error) {
      console.error('删除公告失败:', error);
      alert('删除失败: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'medium',
      status: 'draft'
    });
  };

  const getPriorityClass = (priority) => {
    const classes = {
      low: 'low',
      medium: 'medium',
      high: 'high'
    };
    return classes[priority] || 'medium';
  };

  const getPriorityText = (priority) => {
    const texts = {
      low: '低',
      medium: '中',
      high: '高'
    };
    return texts[priority] || '中';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('zh-CN');
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="announcements-page">
      <div className="page-header">
        <h2>公告管理</h2>
        <button className="btn btn-primary" onClick={() => {
          resetForm();
          setEditingAnnouncement(null);
          setShowModal(true);
        }}>
          新建公告
        </button>
      </div>

      <div className="announcements-list">
        {announcements.length === 0 ? (
          <div className="empty-state">暂无公告</div>
        ) : (
          announcements.map(announcement => (
            <div key={announcement.id} className="announcement-card">
              <div className="announcement-header">
                <h3>{announcement.title}</h3>
                <span className={`priority-badge ${getPriorityClass(announcement.priority)}`}>
                  {getPriorityText(announcement.priority)}
                </span>
              </div>
              <div className="announcement-content">
                {announcement.content}
              </div>
              <div className="announcement-footer">
                <span className="announcement-date">
                  发布时间: {formatDate(announcement.publish_date)}
                </span>
                <span className="announcement-author">
                  作者: {announcement.author_name || announcement.author_id}
                </span>
              </div>
              <div className="announcement-actions">
                <button className="btn btn-secondary" onClick={() => handleEdit(announcement)}>编辑</button>
                <button className="btn btn-danger" onClick={() => handleDelete(announcement.id)}>删除</button>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingAnnouncement ? '编辑公告' : '新建公告'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>公告标题</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>公告内容</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows="6"
                  required
                ></textarea>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>优先级</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="draft">草稿</option>
                    <option value="published">发布</option>
                    <option value="archived">归档</option>
                  </select>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn btn-primary">保存</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
