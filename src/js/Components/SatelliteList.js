import React from 'react';

const SatelliteList = ({
	collisionObjects,
	toggleOrbitsOn,
	clearOrbits,
	goToCollisionTime,
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
							<td className="">
								<button
									className="btn"
									onClick={() => {
										goToCollisionTime(obj.START_UTC, obj.NAME_1, obj.NAME_2);
										clearOrbits();
										toggleOrbitsOn(obj.NAME_1, obj.NAME_2);
									}}
								>
									View
								</button>
								{/* <button
									className="btn"
									onClick={() => toggleOrbits(obj.NAME_1, obj.NAME_2)}
								>
									Orbits
								</button> */}
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default SatelliteList;
