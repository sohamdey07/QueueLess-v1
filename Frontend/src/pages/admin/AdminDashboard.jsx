import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  Users,
  Calendar,
  ArrowUp,
  Layers,
  ChevronDown,
  ArrowRight,
  Settings,
  CalendarPlus,
  Store,
  FileText,
  Plus,
  BarChart3,
  Zap,
  TrendingUp,
  History
} from 'lucide-react';
import AdminBanner from '../../components/admin/AdminBanner';
import serviceApi from '../../services/api/service.api';
import counterApi from '../../services/api/counter.api';
import appointmentApi from '../../services/api/appointment.api';
import './AdminDashboard.css';

// Chart Data (Hourly Distribution for 8 Oct 2026)
const chartTimePoints = [
  '8 AM', '9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '5 PM', '6 PM'
];

const chartData = [
  { time: '8 AM', total: 8, served: 2, waiting: 5, noShow: 1 },
  { time: '9 AM', total: 13, served: 7, waiting: 7, noShow: 2 },
  { time: '10 AM', total: 20, served: 13, waiting: 8, noShow: 2 },
  { time: '11 AM', total: 25, served: 18, waiting: 8, noShow: 3 },
  { time: '12 PM', total: 35, served: 25, waiting: 13, noShow: 5 },
  { time: '1 PM', total: 42, served: 25, waiting: 15, noShow: 5 },
  { time: '2 PM', total: 46, served: 30, waiting: 13, noShow: 3 },
  { time: '3 PM', total: 45, served: 32, waiting: 17, noShow: 4 },
  { time: '4 PM', total: 40, served: 27, waiting: 14, noShow: 3 },
  { time: '5 PM', total: 34, served: 20, waiting: 10, noShow: 2 },
  { time: '6 PM', total: 20, served: 14, waiting: 6, noShow: 1 },
];

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [selectedTimeframe, setSelectedTimeframe] = useState('Day');
  const [liveServices, setLiveServices] = useState([]);
  const [liveCounters, setLiveCounters] = useState([]);
  const [liveStaff, setLiveStaff] = useState([]);
  const [todayStats, setTodayStats] = useState({
    totalAppointmentsToday: 0,
    totalServedToday: 0,
    totalWaitingToday: 0,
    totalNoShowToday: 0,
    services: {},
  });

  // Today's formatted display date
  const currentDisplayDate = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [servicesRes, countersRes, staffRes, overviewRes] = await Promise.allSettled([
          serviceApi.getAllServices(),
          counterApi.getAllCounters(),
          counterApi.getStaffList(),
          appointmentApi.getTodayOverview(),
        ]);
        if (servicesRes.status === 'fulfilled' && Array.isArray(servicesRes.value?.data)) {
          setLiveServices(servicesRes.value.data);
        }
        if (countersRes.status === 'fulfilled' && Array.isArray(countersRes.value?.data)) {
          setLiveCounters(countersRes.value.data);
        }
        if (staffRes.status === 'fulfilled' && Array.isArray(staffRes.value?.data)) {
          setLiveStaff(staffRes.value.data);
        }
        if (overviewRes.status === 'fulfilled' && overviewRes.value?.data) {
          setTodayStats(overviewRes.value.data);
        }
      } catch (e) {
        console.error('Failed to load dashboard metrics:', e);
      }
    };
    fetchStats();
  }, []);
  const [activeChartPoint, setActiveChartPoint] = useState(null);

  // Quick Action Handler
  const handleQuickAction = (route) => {
    navigate(route);
  };

  // Helper to generate smooth SVG path from data series
  const getSvgPath = (key, width = 940, height = 200, maxY = 50) => {
    const points = chartData.map((d, index) => {
      const x = (index / (chartData.length - 1)) * width;
      const y = height - (d[key] / maxY) * height;
      return { x, y };
    });

    if (points.length === 0) return '';

    // Generate smooth bezier curve
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = i > 0 ? points[i - 1] : points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = i != points.length - 2 ? points[i + 2] : p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const getSvgAreaPath = (key, width = 940, height = 200, maxY = 50) => {
    const linePath = getSvgPath(key, width, height, maxY);
    return `${linePath} L ${width} ${height} L 0 ${height} Z`;
  };

  return (
    <div className="admin-dashboard-page">
      {/* 1. Hero Banner */}
      <AdminBanner />

      {/* 2. Top Metric Cards (4 Cards Row) */}
      <div className="admin-stat-cards-grid">
        {/* Card 1: Total Services */}
        <div className="admin-stat-card card-purple-soft">
          <div className="metric-card-header-line">
            <div className="metric-icon-square icon-purple">
              <LayoutGrid size={20} strokeWidth={2.4} />
            </div>
            <span className="metric-card-pill pill-purple">
              <ArrowUp size={11} strokeWidth={2.8} /> {liveServices.filter((s) => s.isActive !== false).length} active
            </span>
          </div>
          <div className="metric-info-block">
            <span className="metric-info-label">Total Services</span>
            <span className="metric-info-value">{liveServices.length}</span>
            <span className="metric-info-subtext">Active department offerings</span>
          </div>
        </div>

        {/* Card 2: Total Staffs */}
        <div className="admin-stat-card card-orange-soft">
          <div className="metric-card-header-line">
            <div className="metric-icon-square icon-orange">
              <Users size={20} strokeWidth={2.4} />
            </div>
            <span className="metric-card-pill pill-orange">
              <ArrowUp size={11} strokeWidth={2.8} /> {liveStaff.length} active
            </span>
          </div>
          <div className="metric-info-block">
            <span className="metric-info-label">Total Staffs</span>
            <span className="metric-info-value">{liveStaff.length}</span>
            <span className="metric-info-subtext">Operational team members</span>
          </div>
        </div>

        {/* Card 3: Total Appointments */}
        <div className="admin-stat-card card-blue-soft">
          <div className="metric-card-header-line">
            <div className="metric-icon-square icon-blue">
              <Calendar size={20} strokeWidth={2.4} />
            </div>
            <span className="metric-card-pill pill-blue">
              <ArrowUp size={11} strokeWidth={2.8} /> Today
            </span>
          </div>
          <div className="metric-info-block">
            <span className="metric-info-label">Total Appointments</span>
            <span className="metric-info-value">{todayStats.totalAppointmentsToday || 0}</span>
            <span className="metric-info-subtext">Bookings scheduled today</span>
          </div>
        </div>

        {/* Card 4: Total Counters (Updated from Total Served) */}
        <div className="admin-stat-card card-green-soft">
          <div className="metric-card-header-line">
            <div className="metric-icon-square icon-green">
              <Store size={20} strokeWidth={2.4} />
            </div>
            <span className="metric-card-pill pill-green">
              <ArrowUp size={11} strokeWidth={2.8} /> {liveCounters.filter((c) => c.isActive !== false).length} active
            </span>
          </div>
          <div className="metric-info-block">
            <span className="metric-info-label">Total Counters</span>
            <span className="metric-info-value">{liveCounters.length}</span>
            <span className="metric-info-subtext">Configured service desks</span>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Today's Overview (Left) + Quick Actions (Right) */}
      <div className="admin-middle-columns-grid">
        {/* Left: Today's Overview Card */}
        <div className="admin-card overview-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">
              <BarChart3 size={20} className="section-title-icon" />
              <span>Today's Overview</span>
            </h2>
            <div className="admin-header-controls">
              <div className="admin-date-pill">
                <Calendar size={14} className="pill-icon" />
                <span>{currentDisplayDate}</span>
              </div>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Service Name</th>
                  <th style={{ textAlign: 'center' }}>Total Appointments</th>
                  <th style={{ textAlign: 'center' }}>Served</th>
                  <th style={{ textAlign: 'center' }}>Waiting</th>
                  <th style={{ textAlign: 'center' }}>No-Show</th>
                  <th style={{ textAlign: 'right', paddingRight: '16px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {liveServices.length > 0 ? (
                  liveServices.slice(0, 10).map((srv, idx) => {
                    const srvId = srv._id || srv.id;
                    const srvStats = todayStats.services?.[srvId] || {
                      totalAppointments: 0,
                      served: 0,
                      waiting: 0,
                      noShow: 0,
                    };
                    return (
                      <tr key={srvId || idx}>
                        <td className="col-index">{idx + 1}</td>
                        <td className="col-service">
                          <div className="service-icon-circle blue-service-bg">
                            <Layers size={16} className="blue-service-icon" />
                          </div>
                          <span className="service-name-text">{srv.name || srv.title}</span>
                        </td>
                        <td className="col-stat">{srvStats.totalAppointments}</td>
                        <td className="col-stat">{srvStats.served}</td>
                        <td className="col-stat">{srvStats.waiting}</td>
                        <td className="col-stat">{srvStats.noShow}</td>
                        <td className="col-status">
                          <span className={`status-pill ${srv.isActive !== false ? 'active-pill' : 'inactive-pill'}`}>
                            <span className={`status-dot ${srv.isActive !== false ? 'green-dot' : 'red-dot'}`} />
                            <span>{srv.isActive !== false ? 'Active' : 'Inactive'}</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#64748B' }}>
                      No services configured yet. Navigate to Service Management to create services.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Quick Actions Card */}
        <div className="admin-card quick-actions-card">
          <div className="admin-card-header">
            <h2 className="admin-card-title">
              <Zap size={20} className="section-title-icon" />
              <span>Quick Actions</span>
            </h2>
          </div>

          <div className="admin-quick-actions-grid">
            {/* Action 1: Add Service */}
            <div 
              className="quick-action-tile theme-blue"
              onClick={() => handleQuickAction('/admin/service')}
            >
              <div className="tile-icon-circle icon-blue-circle">
                <Settings size={22} className="tile-blue-icon" />
              </div>
              <h3 className="tile-title">Add Service</h3>
            </div>

            {/* Action 2: Add Slots */}
            <div 
              className="quick-action-tile theme-green"
              onClick={() => handleQuickAction('/admin/availability')}
            >
              <div className="tile-icon-circle icon-green-circle">
                <CalendarPlus size={22} className="tile-green-icon" />
              </div>
              <h3 className="tile-title">Add Slots</h3>
            </div>

            {/* Action 3: Add Counter */}
            <div 
              className="quick-action-tile theme-amber"
              onClick={() => handleQuickAction('/admin/counter')}
            >
              <div className="tile-icon-circle icon-amber-circle">
                <Store size={22} className="tile-amber-icon" />
              </div>
              <h3 className="tile-title">Add Counter</h3>
            </div>

            {/* Action 4: Queue Logs */}
            <div 
              className="quick-action-tile theme-purple"
              onClick={() => handleQuickAction('/admin/queue-logs')}
            >
              <div className="tile-icon-circle icon-purple-circle">
                <FileText size={22} className="tile-purple-icon" />
              </div>
              <h3 className="tile-title">Queue Logs</h3>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Queue Trends Chart Card */}
      <div className="admin-card trends-card">
        <div className="admin-card-header trends-header">
          <div className="trends-header-left">
            <h2 className="admin-card-title">
              <TrendingUp size={20} className="section-title-icon" />
              <span>Queue Trends</span>
            </h2>
          </div>

          <div className="trends-legend">
            <div className="legend-entry">
              <span className="legend-bullet dot-total" />
              <span>Total</span>
            </div>
            <div className="legend-entry">
              <span className="legend-bullet dot-served" />
              <span>Served</span>
            </div>
            <div className="legend-entry">
              <span className="legend-bullet dot-waiting" />
              <span>Waiting</span>
            </div>
            <div className="legend-entry">
              <span className="legend-bullet dot-noshow" />
              <span>No-Show</span>
            </div>
          </div>

          <div className="admin-header-controls">
            <div className="admin-date-pill">
              <Calendar size={14} className="pill-icon" />
              <span>8 Oct 2026</span>
            </div>
            <div className="admin-select-wrapper">
              <select 
                value={selectedTimeframe} 
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="admin-select"
                aria-label="Select timeframe"
              >
                <option value="Day">Day</option>
                <option value="Week">Week</option>
                <option value="Month">Month</option>
              </select>
              <ChevronDown size={14} className="select-chevron" />
            </div>
          </div>
        </div>

        {/* SVG Area Chart */}
        <div className="trends-chart-wrapper">
          {/* Y Axis Labels */}
          <div className="chart-y-axis">
            <span>50</span>
            <span>40</span>
            <span>30</span>
            <span>20</span>
            <span>10</span>
            <span>0</span>
          </div>

          <div className="chart-svg-container">
            <svg 
              viewBox="0 0 940 200" 
              className="trends-svg"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Total Area Gradient */}
                <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1D68F2" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#1D68F2" stopOpacity="0.01" />
                </linearGradient>

                {/* Served Area Gradient */}
                <linearGradient id="servedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.01" />
                </linearGradient>

                {/* Waiting Area Gradient */}
                <linearGradient id="waitingGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="0" x2="940" y2="0" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="40" x2="940" y2="40" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="80" x2="940" y2="80" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="120" x2="940" y2="120" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="160" x2="940" y2="160" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1="200" x2="940" y2="200" stroke="#E2E8F0" strokeWidth="1" />

              {/* 1. Total (Blue Area & Curve) */}
              <path d={getSvgAreaPath('total')} fill="url(#totalGradient)" />
              <path d={getSvgPath('total')} fill="none" stroke="#1D68F2" strokeWidth="2.5" />

              {/* 2. Served (Green Area & Curve) */}
              <path d={getSvgAreaPath('served')} fill="url(#servedGradient)" />
              <path d={getSvgPath('served')} fill="none" stroke="#10B981" strokeWidth="2.5" />

              {/* 3. Waiting (Orange Area & Curve) */}
              <path d={getSvgAreaPath('waiting')} fill="url(#waitingGradient)" />
              <path d={getSvgPath('waiting')} fill="none" stroke="#F59E0B" strokeWidth="2.5" />

              {/* 4. No-Show (Red Curve) */}
              <path d={getSvgPath('noShow')} fill="none" stroke="#EF4444" strokeWidth="2.2" />

              {/* Data Dots */}
              {chartData.map((d, index) => {
                const x = (index / (chartData.length - 1)) * 940;
                const yTotal = 200 - (d.total / 50) * 200;
                const yServed = 200 - (d.served / 50) * 200;
                const yWaiting = 200 - (d.waiting / 50) * 200;
                const yNoShow = 200 - (d.noShow / 50) * 200;

                return (
                  <g key={d.time}>
                    <circle cx={x} cy={yTotal} r="3.5" fill="#1D68F2" />
                    <circle cx={x} cy={yServed} r="3.5" fill="#10B981" />
                    <circle cx={x} cy={yWaiting} r="3.5" fill="#F59E0B" />
                    <circle cx={x} cy={yNoShow} r="3" fill="#EF4444" />
                  </g>
                );
              })}
            </svg>

            {/* X Axis Labels */}
            <div className="chart-x-axis">
              {chartTimePoints.map((time, idx) => (
                <span 
                  key={time} 
                  className="x-label"
                  onMouseEnter={() => setActiveChartPoint(chartData[idx])}
                  onMouseLeave={() => setActiveChartPoint(null)}
                >
                  {time}
                </span>
              ))}
            </div>

            {/* Interactive Tooltip Popover */}
            {activeChartPoint && (
              <div className="chart-tooltip">
                <span className="tooltip-title">{activeChartPoint.time} Overview</span>
                <div className="tooltip-row">
                  <span style={{ color: '#1D68F2' }}>Total:</span>
                  <b>{activeChartPoint.total}</b>
                </div>
                <div className="tooltip-row">
                  <span style={{ color: '#10B981' }}>Served:</span>
                  <b>{activeChartPoint.served}</b>
                </div>
                <div className="tooltip-row">
                  <span style={{ color: '#F59E0B' }}>Waiting:</span>
                  <b>{activeChartPoint.waiting}</b>
                </div>
                <div className="tooltip-row">
                  <span style={{ color: '#EF4444' }}>No-Show:</span>
                  <b>{activeChartPoint.noShow}</b>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Bottom Section: Recent Activity Card */}
      <div className="admin-card recent-activity-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">
            <History size={20} className="section-title-icon" />
            <span>Recent Activity</span>
          </h2>
          <button 
            type="button" 
            className="admin-view-all-btn"
            onClick={() => navigate('/admin/queue-logs')}
          >
            <span>View All</span>
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="admin-table-container">
          <table className="admin-table activity-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>#</th>
                <th>Activity</th>
                <th>Details</th>
                <th>User</th>
                <th style={{ textAlign: 'right', paddingRight: '16px' }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {/* Activity 1 */}
              <tr>
                <td className="col-index">1</td>
                <td className="col-activity">
                  <div className="activity-icon-badge green-badge">
                    <Plus size={14} className="activity-green-icon" />
                  </div>
                  <span className="activity-name-text">New Service Created</span>
                </td>
                <td className="col-details">Follow-up Consultation</td>
                <td className="col-user">Admin User</td>
                <td className="col-time">10:15 AM</td>
              </tr>

              {/* Activity 2 */}
              <tr>
                <td className="col-index">2</td>
                <td className="col-activity">
                  <div className="activity-icon-badge blue-badge">
                    <Calendar size={14} className="activity-blue-icon" />
                  </div>
                  <span className="activity-name-text">Availability Created</span>
                </td>
                <td className="col-details">General Consultation - 8 Oct 2026</td>
                <td className="col-user">Admin User</td>
                <td className="col-time">09:48 AM</td>
              </tr>

              {/* Activity 3 */}
              <tr>
                <td className="col-index">3</td>
                <td className="col-activity">
                  <div className="activity-icon-badge orange-badge">
                    <Store size={14} className="activity-orange-icon" />
                  </div>
                  <span className="activity-name-text">Counter Added</span>
                </td>
                <td className="col-details">Counter 3</td>
                <td className="col-user">Admin User</td>
                <td className="col-time">09:30 AM</td>
              </tr>

              {/* Activity 4 */}
              <tr>
                <td className="col-index">4</td>
                <td className="col-activity">
                  <div className="activity-icon-badge purple-badge">
                    <FileText size={14} className="activity-purple-icon" />
                  </div>
                  <span className="activity-name-text">Queue Log Viewed</span>
                </td>
                <td className="col-details">General Consultation</td>
                <td className="col-user">Admin User</td>
                <td className="col-time">09:12 AM</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
