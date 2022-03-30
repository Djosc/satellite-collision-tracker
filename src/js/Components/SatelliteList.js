import React from 'react';

const SatelliteList = ({ collisionObjects, toggleSelected, goToCollisionTime }) => {
	const handleClick = (idx) => {
		toggleSelected(idx * 2);
	};

	const logTime = (startTime) => {
		let start = new Date(startTime);
		let isoDate = new Date(
			start.getTime() - start.getTimezoneOffset() * 60000
		).toISOString();
		console.log(startTime);
		console.log(start);
		console.log(isoDate);
	};

	return (
		<div className="toolbar-dropdown">
			<h3 className="dropdown-heading">Collision Data</h3>
			<div className="headings-container">
				<span>Name</span>
				<span>Max Probability</span>
				<span>Min Range (km)</span>
				<span>Rel Velocity (km/sec)</span>
				<span></span>
				<span></span>
			</div>
			<div className="collision-container">
				{collisionObjects.map((obj, idx) => (
					<div className="collision-row" key={idx}>
						<div className="collision-name-wrap">
							<li>{obj.NAME_1}</li>
							<li>{obj.NAME_2}</li>
						</div>
						<div className="collision-data-wrap">
							<li>{obj.MAX_PROBABILITY}</li>
						</div>
						<div className="collision-data-wrap">
							<li>{obj.MIN_RANGE_KM}</li>
						</div>
						<div className="collision-data-wrap">
							<li>{obj.REL_VELOCITY_KM_SEC}</li>
						</div>

						<div className="btn-wrap">
							<button
								className="btn"
								onClick={() => goToCollisionTime(obj.START_UTC, obj.NAME_1)}
							>
								Collision Time
							</button>
						</div>
						<div className="btn-wrap">
							<button className="btn" onClick={() => toggleSelected(idx)}>
								Toggle Orbits
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	);
};

export default SatelliteList;
