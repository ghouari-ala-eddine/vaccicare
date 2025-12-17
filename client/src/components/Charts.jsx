import './Charts.css';

// Circular Progress Chart
export const CircularProgress = ({ percentage, size = 120, strokeWidth = 10, color = 'primary', label }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    const colorMap = {
        primary: 'var(--primary-500)',
        success: 'var(--success-500)',
        warning: 'var(--warning-500)',
        danger: 'var(--danger-500)'
    };

    return (
        <div className="circular-progress" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <circle
                    className="progress-bg"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                <circle
                    className="progress-fill"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{ stroke: colorMap[color] || colorMap.primary }}
                />
            </svg>
            <div className="progress-content">
                <span className="progress-value">{Math.round(percentage)}%</span>
                {label && <span className="progress-label">{label}</span>}
            </div>
        </div>
    );
};

// Bar Chart
export const BarChart = ({ data, height = 200 }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="bar-chart" style={{ height }}>
            <div className="bars-container">
                {data.map((item, index) => (
                    <div key={index} className="bar-item">
                        <div className="bar-wrapper">
                            <div
                                className="bar-fill"
                                style={{
                                    height: `${(item.value / maxValue) * 100}%`,
                                    background: item.color || 'var(--primary-500)'
                                }}
                            >
                                <span className="bar-value">{item.value}</span>
                            </div>
                        </div>
                        <span className="bar-label">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Mini Progress Bar
export const ProgressBar = ({ value, max, color = 'primary', showLabel = true }) => {
    const percentage = max > 0 ? (value / max) * 100 : 0;

    const colorMap = {
        primary: 'var(--bg-gradient)',
        success: 'linear-gradient(135deg, var(--success-400), var(--success-600))',
        warning: 'linear-gradient(135deg, var(--warning-400), var(--warning-600))',
        danger: 'linear-gradient(135deg, var(--danger-400), var(--danger-600))'
    };

    return (
        <div className="mini-progress">
            <div className="mini-progress-track">
                <div
                    className="mini-progress-fill"
                    style={{
                        width: `${percentage}%`,
                        background: colorMap[color] || colorMap.primary
                    }}
                ></div>
            </div>
            {showLabel && (
                <span className="mini-progress-label">{value}/{max}</span>
            )}
        </div>
    );
};

// Stat Donut Chart (for displaying multiple stats)
export const DonutChart = ({ segments, size = 150, strokeWidth = 20 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;

    const total = segments.reduce((sum, seg) => sum + seg.value, 0);
    let currentOffset = 0;

    return (
        <div className="donut-chart" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
                <circle
                    className="donut-bg"
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    strokeWidth={strokeWidth}
                />
                {segments.map((segment, index) => {
                    const segmentLength = total > 0 ? (segment.value / total) * circumference : 0;
                    const offset = circumference - segmentLength;
                    const rotation = currentOffset;
                    currentOffset += (segment.value / total) * 360;

                    return (
                        <circle
                            key={index}
                            className="donut-segment"
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            strokeWidth={strokeWidth}
                            strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                            style={{
                                stroke: segment.color,
                                transform: `rotate(${rotation - 90}deg)`,
                                transformOrigin: 'center'
                            }}
                        />
                    );
                })}
            </svg>
            <div className="donut-content">
                <span className="donut-total">{total}</span>
                <span className="donut-label">Total</span>
            </div>
        </div>
    );
};
