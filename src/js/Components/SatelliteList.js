import React from 'react';

const SatelliteList = ({ collisionObjects, toggleSelected }) => {
	const handleClick = (idx) => {
		toggleSelected(idx * 2);
	};

	return (
		<div className="toolbar-dropdown">
			<h3 className="dropdown-heading">Collision Data</h3>
			<div className="collision-container">
				{collisionObjects.map((obj, idx) => (
					<div className="collision-row" key={idx} onClick={() => handleClick(idx)}>
						<li>{obj.NAME_1}</li>
						<li>{obj.NAME_2}</li>
					</div>
				))}
			</div>
		</div>
	);
};

export default SatelliteList;
