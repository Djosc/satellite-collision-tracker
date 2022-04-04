import React from 'react';

const SatelliteList = ({
	collisionObjects,
	toggleOrbitsOn,
	clearOrbits,
	goToCollisionTime,
	selectedIdx,
	setSelectedIdx,
}) => {
	return (
		<div className="toolbar-dropdown">
			<h3 className="dropdown-heading">Collision Data</h3>
			<table>
				<thead className="">
					<tr>
						<th>Name</th>
						<th>
							Max <br /> Probability
						</th>
						<th>
							Min Range <br /> (km)
						</th>
						<th>
							Rel Velocity <br /> (km/sec)
						</th>
						<th>
							Time <br /> (UTC)
						</th>
					</tr>
				</thead>
				<tbody className="">
					{collisionObjects.map((obj, idx) => (
						<tr className="" key={idx}>
							<td>
								{obj.NAME_1} <br /> {obj.NAME_2}
							</td>
							<td>{obj.MAX_PROBABILITY}</td>
							<td>{obj.MIN_RANGE_KM}</td>
							<td>{obj.REL_VELOCITY_KM_SEC}</td>
							<td>{obj.START_UTC.slice(5, -4)}</td>
							<td>
								<button
									className="btn"
									onClick={() => {
										goToCollisionTime(obj.START_UTC, obj.NAME_1, obj.NAME_2);
										clearOrbits();
										toggleOrbitsOn(obj.NAME_1, obj.NAME_2);
										setSelectedIdx(idx);
									}}
								>
									View
								</button>
							</td>
							<td style={{ position: 'relative', width: '16px' }}>
								{console.log(selectedIdx)}
								<span
									className={selectedIdx === idx ? 'on-off green' : 'on-off red'}
								></span>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default SatelliteList;
