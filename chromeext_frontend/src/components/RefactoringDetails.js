import React from "react";

const RefactoringDetails = () => {
  const refactorings = [
    "Pull up Method: gA() → from class org.animal.Dog",
    "Pull up Attribute: pA → from class org.animal.Dog",
  ];

  return (
    <div className="refactoring-details">
      <h2>Refactoring Details</h2>
      <ul>
        {refactorings.map((ref, index) => (
          <li key={index}>{ref}</li>
        ))}
      </ul>
    </div>
  );
};

export default RefactoringDetails;
