import "./InterviewType.css";
export default function InterviewType() {
  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <ul>
          <li>Dashboard/Home</li>
          <li>Profile</li>
          <li>History</li>
        </ul>
      </aside>
      <main>
        <h2>Choose Your Interview Type</h2>
        <div className="grid">
          <div className="card">
            <h3>Technical Interview</h3>
            <p>Focuses on algorithms, data structures, and system design challenges, evaluating problem-solving skills.</p>
          </div>
          <div className="card">
            <h3>HR & Behavioral</h3>
            <p>Assesses communication skills, leadership potential, teamwork, and cultural fit within the organization.</p>
          </div>
          <div className="card">
            <h3>AI/ML Specific</h3>
            <p>Covers machine learning algorithms, deep learning architectures, model evaluation, and deployment strategies.</p>
          </div>
          <div className="card">
            <h3>Company-Specific</h3>
            <p>Tailored to a specific company's products, technologies, business model, and values, requiring deep research.</p>
          </div>
        </div>
        <button className="btn">Start Interview</button>
      </main>
    </div>
  );
}
