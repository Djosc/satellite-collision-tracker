import React, { useState } from 'react';
import SatelliteList from './SatelliteList';

const CustomToolbar = ({ setICRF, collisionObjects, toggleSelected }) => {
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
						toggleSelected={toggleSelected}
					/>
				) : (
					<></>
				)}
			</div>
		</>
	);
};

export default CustomToolbar;
