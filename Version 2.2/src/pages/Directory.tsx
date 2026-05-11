// Version2/src/pages/Directory.tsx
import React, { useEffect, useState } from 'react';
import api from '../api';
import './Directory.css'; // Import the new CSS file

interface AlumniMember {
  alumni_id: number;
  full_name: string;
  batch_year: number;
  programme: string;
  phone: string;
}

const Directory: React.FC = () => {
  const [alumniList, setAlumniList] = useState<AlumniMember[]>([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDirectory = async () => {
      try {
        const response = await api.get('/directory');
        if (response.data.success) {
          setAlumniList(response.data.data);
        }
      } catch (err) {
        setError('Failed to load directory data. Please try again.');
      }
    };
    fetchDirectory();
  }, []);

  // Filter based on the search bar input
  const filteredList = alumniList.filter(a => 
    a.full_name.toLowerCase().includes(search.toLowerCase()) ||
    a.programme.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="directory-page">
      <div className="directory-container">
        <h1 className="directory-title">Alumni Directory</h1>
        
        <div className="search-container">
          <input 
            type="text" 
            placeholder="Search alumni by name or programme..." 
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="directory-grid">
          {filteredList.map(alumni => (
            <div key={alumni.alumni_id} className="alumni-card">
              <h2 className="alumni-name">{alumni.full_name}</h2>
              
              <div className="alumni-details">
                <p><strong>Batch:</strong> {alumni.batch_year}</p>
                <p><strong>Programme:</strong> {alumni.programme}</p>
              </div>
              
              <div className="alumni-phone-wrapper">
                <span className="alumni-phone-badge">
                  📞 {alumni.phone}
                </span>
              </div>
            </div>
          ))}
          
          {filteredList.length === 0 && !error && (
            <div className="no-results">
              <p>No alumni found matching "{search}".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Directory;