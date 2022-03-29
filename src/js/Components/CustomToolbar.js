import React from 'react';

const CustomToolbar = ({ setICRF }) => {
	return (
		<div className="cesium-viewer-toolbar" style={{ right: 'unset', left: '5px' }}>
			<button className="cesium-button cesium-toolbar-button" onClick={() => setICRF()}>
				ICRF
			</button>
		</div>
	);
};

export default CustomToolbar;
