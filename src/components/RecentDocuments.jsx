import React from 'react';

const RecentDocuments = () => {
  const documents = [
    { name: '2024年度计划.docx', type: 'word', size: '2.3MB', date: '2024-01-10' },
    { name: '项目需求分析.pdf', type: 'pdf', size: '1.8MB', date: '2024-01-09' },
    { name: '财务报表.xlsx', type: 'excel', size: '3.2MB', date: '2024-01-08' },
    { name: '会议纪要.docx', type: 'word', size: '0.9MB', date: '2024-01-07' }
  ];

  const getFileIcon = (type) => {
    switch (type) {
      case 'word': return '📄';
      case 'pdf': return '📕';
      case 'excel': return '📊';
      default: return '📄';
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          📄 最近文档
        </h3>
        <span className="card-action">查看全部</span>
      </div>
      <div className="card-content">
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>文档名称</th>
                <th>大小</th>
                <th>修改时间</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, index) => (
                <tr key={index}>
                  <td>
                    <span style={{ marginRight: '8px' }}>
                      {getFileIcon(doc.type)}
                    </span>
                    {doc.name}
                  </td>
                  <td>{doc.size}</td>
                  <td>{doc.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RecentDocuments;