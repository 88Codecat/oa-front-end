import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { announcementAPI } from '../utils/api';
import '../components/BackButton.css';

const Announcements = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [detailAnnouncement, setDetailAnnouncement] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    status: 'draft'
  });

  // 返回工作台
  const handleBack = () => {
    window.location.href = '/home';
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  // 处理URL参数中的公告ID
  useEffect(() => {
    if (id) {
      const announcement = announcements.find(a => String(a.id) === String(id));
      if (announcement) {
        setDetailAnnouncement(announcement);
        setShowDetailModal(true);
      }
    }
  }, [id, announcements]);

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
      <div className="page-topbar">
        <button className="back-btn" onClick={handleBack}>
          返回工作台
        </button>
      </div>

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

      {/* 公告详情弹窗 */}
      {showDetailModal && detailAnnouncement && (
        <div className="modal" onClick={() => { setShowDetailModal(false); navigate('/announcements'); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>公告详情</h3>
              <button className="close-btn" onClick={() => { setShowDetailModal(false); navigate('/announcements'); }}>&times;</button>
            </div>
            <div className="announcement-detail-content">
              <div className="detail-row">
                <label>标题:</label>
                <span>{detailAnnouncement.title}</span>
              </div>
              <div className="detail-row">
                <label>优先级:</label>
                <span className={`priority-badge ${getPriorityClass(detailAnnouncement.priority)}`}>
                  {getPriorityText(detailAnnouncement.priority)}
                </span>
              </div>
              <div className="detail-row">
                <label>发布时间:</label>
                <span>{formatDate(detailAnnouncement.publish_date)}</span>
              </div>
              <div className="detail-row">
                <label>作者:</label>
                <span>{detailAnnouncement.author_name || detailAnnouncement.author_id}</span>
              </div>
              <div className="detail-row full-width">
                <label>公告内容:</label>
                <p className="detail-content">{detailAnnouncement.content}</p>
              </div>
              <div className="detail-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => { setShowDetailModal(false); navigate('/announcements'); }}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
