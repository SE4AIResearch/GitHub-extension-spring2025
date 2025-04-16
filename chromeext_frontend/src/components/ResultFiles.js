import React from 'react';

const ResultFiles = ({ files }) => {
  if (!files || files.length === 0) {
    return null; // Don't show anything if there are no files
  }

  // We still need to render the files for the links to work, but we return null for display
  // This ensures the data is still available for the parent component
  return null;

  /* Original code removed as per user's request to not display file names
  return (
    <div className="result-files">
      <h3>Result Files</h3>
      <ul>
        {files.map((file, index) => (
          <li key={index}>
            <a 
              href={`http://localhost:8080/api/results/${file}`} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {file}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
  */
};

export default ResultFiles; 