import "./Dashboard.css";
export default function Dashboard() {
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
        <h2>Hi, Sarah Miller</h2>
        <div className="grid">
          <div className="card">Upload Resume</div>
          <div className="card">Upload JD</div>
          <div className="card">Choose Interview Type</div>
          <div className="card">View Past Reports</div>
        </div>
      </main>
    </div>
  );
}
