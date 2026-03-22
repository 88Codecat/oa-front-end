import { useState, useEffect } from 'react';
import { positionAPI, departmentAPI } from '../utils/api';

const Positions = () => {
  const [positions, setPositions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    department_id: '',
    level: '1',
    description: ''
  });

  useEffect(() => {
    loadPositions();
    loadDepartments();
  }, []);

  const loadPositions = async () => {
    try {
      setLoading(true);
      const data = await positionAPI.getList();
      setPositions(data.data || []);
    } catch (error) {
      console.error('加载职位失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await departmentAPI.getList();
      setDepartments(data.data || []);
    } catch (error) {
      console.error('加载部门失败:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPosition) {
        await positionAPI.update(editingPosition.id, formData);
      } else {
        await positionAPI.create(formData);
      }
      setShowModal(false);
      setEditingPosition(null);
      resetForm();
      loadPositions();
    } catch (error) {
      console.error('保存职位失败:', error);
      alert('保存失败: ' + error.message);
    }
  };

  const handleEdit = (position) => {
    setEditingPosition(position);
    setFormData({
      title: position.title,
      department_id: position.department_id || '',
      level: position.level || '1',
      description: position.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('确定要删除这个职位吗?')) return;
    try {
      await positionAPI.delete(id);
      loadPositions();
    } catch (error) {
      console.error('删除职位失败:', error);
      alert('删除失败: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      department_id: '',
      level: '1',
      description: ''
    });
  };

  const getDepartmentName = (departmentId) => {
    const dept = departments.find(d => d.id == departmentId);
    return dept ? dept.name : departmentId || '-';
  };

  const getLevelText = (level) => {
    const levels = {
      1: '初级',
      2: '中级',
      3: '高级',
      4: '专家',
      5: '首席'
    };
    return levels[level] || `${level}级`;
  };

  if (loading) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="positions-page">
      <div className="page-header">
        <h2>职位管理</h2>
        <button className="btn btn-primary" onClick={() => {
          resetForm();
          setEditingPosition(null);
          setShowModal(true);
        }}>
          新建职位
        </button>
      </div>

      <div className="positions-list">
        {positions.length === 0 ? (
          <div className="empty-state">暂无职位</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>职位名称</th>
                <th>所属部门</th>
                <th>级别</th>
                <th>描述</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {positions.map(position => (
                <tr key={position.id}>
                  <td>{position.title}</td>
                  <td>{getDepartmentName(position.department_id)}</td>
                  <td>
                    <span className="level-badge">
                      {getLevelText(position.level)}
                    </span>
                  </td>
                  <td>{position.description || '-'}</td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(position)}>编辑</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(position.id)}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingPosition ? '编辑职位' : '新建职位'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>职位名称</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>所属部门</label>
                  <select
                    value={formData.department_id}
                    onChange={(e) => setFormData({...formData, department_id: e.target.value})}
                  >
                    <option value="">请选择</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>级别</label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({...formData, level: e.target.value})}
                  >
                    <option value="1">初级 (1级)</option>
                    <option value="2">中级 (2级)</option>
                    <option value="3">高级 (3级)</option>
                    <option value="4">专家 (4级)</option>
                    <option value="5">首席 (5级)</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>描述</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="3"
                ></textarea>
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

export default Positions;
