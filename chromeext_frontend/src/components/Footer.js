import React from "react";

const Footer = () => {
  const team = [
    { name: "Ali Vaziri ", id: "20019007" },
    { name: "Ishan Garg", id: "20021177" },
    { name: "Meghna Agrawal", id: "20021843" },
    { name: "Priyanshi Yadav", id: ".." },
    { name: "Vaibhavi Shah", id: "20021313" },
  ];

  return (
    <footer className="dashboard-footer">
      
      <div className="footer-center">
        <div className="footer-ids">
          {team.map((member, index) => (
            <div key={index} className="team-member">
            <strong>{member.name}</strong>
            <span>({member.id})</span>
            </div>
          ))}
        </div>
      </div>
      <div className="footer-left">
        <p>SSW 695<br />Software Engineering Capstone Studio</p>
      </div>

      <div className="footer-right">
        <p>Stevens Institute of Technology</p>
      </div>

      <div className="footer-bottom">
        <a
          href="https://github.com/SE4AIResearch/GitHub-extension-spring2025"
          target="_blank"
          rel="noopener noreferrer"
        >
          🔗 GitHub Repository
        </a>
        <span>© 2025 CommitPro</span>
      </div>
    </footer>
  );
};

export default Footer;
