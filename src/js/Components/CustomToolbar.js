import React, { useState } from 'react';
import SatelliteList from './SatelliteList';

const CustomToolbar = ({
	setICRF,
	collisionObjects,
	toggleOrbitsOn,
	clearOrbits,
	goToCollisionTime,
}) => {
	const [showSatList, setShowSatList] = useState(false);

	return (
		<>
			<div className="cesium-viewer-toolbar" style={{ right: 'unset', left: '5px' }}>
				<button
					className="cesium-button cesium-toolbar-button"
					onClick={() => setShowSatList(!showSatList)}
				>
					Sats
				</button>
				<button className="cesium-button cesium-toolbar-button" onClick={() => setICRF()}>
					ICRF
				</button>
				{showSatList ? (
					<SatelliteList
						collisionObjects={collisionObjects}
						toggleOrbitsOn={toggleOrbitsOn}
						clearOrbits={clearOrbits}
						goToCollisionTime={goToCollisionTime}
					/>
				) : (
					<></>
				)}
			</div>
		</>
	);
};

export default CustomToolbar;
