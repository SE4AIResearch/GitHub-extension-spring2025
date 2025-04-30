import React from 'react';

const RefactoringsList = ({ refactorings }) => {
  if (!refactorings || refactorings.length === 0) {
    return <div className="no-refactorings">No refactorings detected in this commit.</div>;
  }

  return (
    <div className="refactorings-list">
      <ul>
        {refactorings.map((refactoring, index) => {
          // Parse the refactoring text to remove the number prefix if it exists
          const cleanedText = refactoring.replace(/^\d+\.\s*/, '');
          return (
            <li key={index}>
              {cleanedText}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default RefactoringsList; 